#!/bin/bash -e
# Copyright 2023 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
# with the License. A copy of the License is located at http://aws.amazon.com/apache2.0/
# or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
# limitations under the License.

usage="$(basename "$0") [-h] --bucket bucket [--region region] [--version version] [--public true|false] [--overwrite true|false])"
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
version=latest

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -h)
    echo "$usage" >&2
    exit 1
    ;;
    --region)
    export region=$2
    shift # past argument
    shift # past value
    ;;
    --bucket)
    bucket=$2
    shift # past argument
    shift # past value
    ;;
    --pcbucket)
    pcbucket=$2
    shift # past argument
    shift # past value
    ;;
    --public)
    export public=$2
    shift # past argument
    shift # past value
    ;;
    --overwrite)
    export overwrite=$2
    shift # past argument
    shift # past value
    ;;
    --version)
    export version=$2
    shift # past argument
    shift # past value
    ;;
    *)    # unknown option
    echo "$usage" >&2
    exit 1
    ;;
esac
done

if [ -z "${bucket}" ] ; then
    echo "$usage" >&2
    exit 1
fi

if [ "${public}" == "true" ]; then
    echo "Uploading for public read access."
    acl="--acl public-read"
else
    acl=""
fi


key="parallelcluster-ui/${version}/layers/aws-parallelcluster-ui/layer.zip"
if ! aws s3api head-object --bucket ${bucket} --key ${key} 2>1 > /dev/null || [ "${overwrite}" == "true" ]; then
    if [ "${region}" == "us-east-1" ]; then
        aws s3 cp ${acl} ${dir}/layer.zip s3://${bucket}/${key}
    else
        aws s3 cp ${acl} ${dir}/layer.zip s3://${bucket}/${key} --region $region
    fi
fi

s3_upload() {
    src=$1
    bucket=$2
    key=$3

    if ! aws s3api head-object --bucket ${bucket} --key ${key} > /dev/null 2>1 || [ "${overwrite}" == "true" ] ; then
        if [ "${region}" == "us-east-1" ]; then
            aws s3 cp ${acl} ${src} s3://${bucket}/${key}
        else
            aws s3 cp ${acl} ${src} s3://${bucket}/${key} --region $region
        fi
    fi
}

# loop over each of the known stacks and upload them
stacks=( "${dir}/../infrastructure/parallelcluster-ui.yaml"
         "${dir}/../infrastructure/parallelcluster-ui-cognito.yaml" )
for stack in "${stacks[@]}"
do
    stack_file=$(basename ${stack})
    if [ "${stack_file}" == "parallelcluster-ui.yaml" ]; then
        key="parallelcluster-ui/${version}/templates/parallelcluster-ui.yaml"
        if [ ! -z "${pcbucket}" ]; then
            temp_stack_file=$(mktemp /tmp/parallelcluster-ui.XXXXXX).yaml
            cat ${stack} | \
                sed "s/Bucket: ''.*\( #.*ParallelCluster bucket.*\)/Bucket: \"${pcbucket}\"\1/" \
                > ${temp_stack_file}
            s3_upload ${temp_stack_file} ${bucket} ${key}
            rm ${temp_stack_file}
            continue
        fi
    elif [ "${stack_file}" == "parallelcluster-ui-cognito.yaml" ]; then
        key="parallelcluster-ui/${version}/templates/parallelcluster-ui-cognito.yaml"
    else
        echo "Unknown stack file: ${stack_file}"
        exit -1
    fi
    s3_upload ${stack} ${bucket} ${key}
done
