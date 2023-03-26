#!/bin/bash
# Copyright 2023 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
# with the License. A copy of the License is located at http://aws.amazon.com/apache2.0/
# or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
# limitations under the License.

usage="$(basename "$0") [-h] [--version version] [--overwrite true|false] [--regions \"space_separated_regions\"] [--bucket bucket] [--pcbucket bucket]"
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
    --version)
    export version=$2
    shift # past argument
    shift # past value
    ;;
    --overwrite)
    export overwrite=$2
    shift # past argument
    shift # past value
    ;;
    --pcbucket)
    export pcbucket=$2
    shift # past argument
    shift # past value
    ;;
    --bucket)
    export bucket=$2
    shift # past argument
    shift # past value
    ;;
    --regions)
    export regions=$2
    shift # past argument
    shift # past value
    ;;
    *)    # unknown option
    echo "$usage" >&2
    exit 1
    ;;
esac
done

create_bucket() {
    bucket=$1
    region=$2
    echo "Creating bucket: ${bucket} in region ${region}"
    if [ ! "${region}" == "us-east-1" ]; then
        aws s3api create-bucket --bucket ${bucket} --region ${region} --create-bucket-configuration LocationConstraint=${region}
    else
        aws s3api create-bucket --bucket ${bucket} --region ${region}
    fi

    policy_file=$(mktemp /tmp/bucket_policy.XXXXXX).json
    (export bucket=$bucket; cat ${dir}/bucket_policy.json.templ | envsubst > ${policy_file})
    aws s3api put-bucket-policy  --bucket ${bucket} --policy file://${policy_file} --region ${region}
    rm ${policy_file}
}

if [ ! -e ${dir}/layer.zip ] || [ "${overwrite}" == "true" ]; then
    ${dir}/build_layer.sh
fi

if [ -z "${regions}" ]; then
    regions=( $(aws ec2 describe-regions --query "Regions[*].RegionName" --output text) )
else
    regions=( ${regions} )
fi

for region in "${regions[@]}"
do
    regional_bucket=$(export region=${region}; echo $bucket | envsubst)
    bucket_arg="--bucket $regional_bucket"

    if [ ! -z "${pcbucket}" ]; then
        pcbucket_arg=$(export region=${region}; echo --pcbucket $pcbucket | envsubst)
    fi

    if ! aws s3api head-bucket --bucket "$regional_bucket" 2>/dev/null; then
        create_bucket ${regional_bucket} ${region}
    else
        echo "arn:aws:s3:::${regional_bucket}"
    fi
    ${dir}/upload.sh --region ${region} ${bucket_arg} ${pcbucket_arg} --public true --version ${version} --overwrite true
done
