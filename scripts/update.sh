#!/bin/bash
# Copyright 2023 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
# with the License. A copy of the License is located at http://aws.amazon.com/apache2.0/
# or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
# limitations under the License.

usage="$(basename "$0") [-h] --version version --stack-name stack-name [--email email] [--region region] [--prefix prefix] [--suffix suffix] [--cognito-stack-id stack-id]"
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
version=latest
stack_name=${PCUI_STACK_ID}
pc_version=3.6.0

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
    --email)
    export email=$2
    shift # past argument
    shift # past value
    ;;
    --stack-name)
    export stack_name=$2
    shift # past argument
    shift # past value
    ;;
    --cognito-stack-id)
    export cognito_stack_id=$2
    shift # past argument
    shift # past value
    ;;
    --bucket)
    export bucket=$2
    shift # past argument
    shift # past value
    ;;
    --region)
    export AWS_DEFAULT_REGION=$2
    shift # past argument
    shift # past value
    ;;
    *)    # unknown option
    echo "$usage" >&2
    exit 1
    ;;
esac
done


random-string() {
    if [[ $OSTYPE == 'darwin'* ]]; then
        echo $RANDOM | md5 | head -c 5; echo;
    else
        echo $RANDOM | md5sum | head -c 5; echo;
    fi
}

update_stack(){
    if [ ! -z "${bucket}" ]; then
        regional_bucket=$(export region=${AWS_DEFAULT_REGION}; echo $bucket | envsubst)
    fi
    regional_bucket=$(export region=${AWS_DEFAULT_REGION}; echo $bucket | envsubst)

    if [ ! -z "${cognito_stack_id}" ]; then
        cognito_params="
                  ParameterKey=SNSRole,UsePreviousValue=true \
                  ParameterKey=UserPoolAuthDomain,UsePreviousValue=true \
                  ParameterKey=UserPoolId,UsePreviousValue=true"
    fi
    aws cloudformation update-stack --stack-name ${stack_name} \
                  --template-url="https://${regional_bucket}.s3.us-east-2.amazonaws.com/parallelcluster-ui/${version}/templates/parallelcluster-ui.yaml" \
                  --parameters ParameterKey=InfrastructureBucket,UsePreviousValue=true \
                  ParameterKey=AdminUserEmail,UsePreviousValue=true \
                  ParameterKey=Version,UsePreviousValue=true \
                  ParameterKey=PCUIVersion,ParameterValue=${version} \
                  ${cognito_params} \
                  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND
}

create_stack(){
    if [ -z "${email}" ]; then
        echo "You must specify an email address to create a new PCUI stack."
        echo "$usage" >&2
        exit 1
    fi

    stack_name=$(echo "pcui"-`random-string`)

    if [ ! -z "${bucket}" ]; then
        regional_bucket=$(export region=${AWS_DEFAULT_REGION}; echo $bucket | envsubst)
        bucket_arg="ParameterKey=InfrastructureBucket,ParameterValue=${regional_bucket}"
    fi
    url="https://${regional_bucket}.s3.us-east-2.amazonaws.com/parallelcluster-ui/${version}/templates/parallelcluster-ui.yaml"

    if [ ! -z "${cognito_stack_id}" ]; then
        cognito_params=$(aws cloudformation describe-stacks \
            --stack-name ${cognito_stack_id} \
            --query "Stacks|[0].Outputs[*].[OutputKey,'=',OutputValue]" \
            --output text | sed -e"s/\([a-zA-Z]*\)[^=]*=[^a-z]*\(.*\)/ParameterKey=\1,ParameterValue=\2 /g" | xargs echo)
    fi

    aws cloudformation create-stack \
        --stack-name ${stack_name} \
        --parameters ${bucket_arg} \
                     ParameterKey=AdminUserEmail,ParameterValue=${email} \
                     ParameterKey=Version,ParameterValue=${pc_version} \
                     ParameterKey=PCUIVersion,ParameterValue=${version} \
                     ${cognito_params} \
        --template-url ${url} \
        --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND
}

if [ -z ${stack_name} ]; then
    create_stack
else
    update_stack
fi
