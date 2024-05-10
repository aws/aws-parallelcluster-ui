#!/bin/bash
set -e
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
# with the License. A copy of the License is located at
#
# http://aws.amazon.com/apache2.0/
#
# or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
# limitations under the License.

# This script is used to update the infrastructure of a given PCM environment.
# An environment is composed of a list of variables with the entrypoints of the environment
# and a CloudFormation request file where the stack update can be customized,
# for example by changing the parameters provided to the previous version of the stack
#
# Usage: ./scripts/deploy.sh [ENVIRONMENT]
# Example: ./scripts/deploy.sh demo

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

INFRASTRUCTURE_DIR="$CURRENT_DIR/../infrastructure"

source "$CURRENT_DIR/common.sh"

ENVIRONMENT=$1

[[ -z $ENVIRONMENT ]] && fail "Missing required argument: ENVIRONMENT"

info "Selected environment: $ENVIRONMENT"

source "$INFRASTRUCTURE_DIR/environments/$ENVIRONMENT-variables.sh"

# STEP: Upload templates
info "Retrieving infrastructure bucket"
if [[ -n $INFRA_BUCKET_NAME ]]; then
  BUCKET=$INFRA_BUCKET_NAME
else
  BUCKET=$(aws cloudformation describe-stack-resources \
    --region "$REGION" \
    --stack-name "$INFRA_BUCKET_STACK_NAME" \
    --logical-resource-id InfrastructureBucket \
    --output text \
    --query 'StackResources[0].PhysicalResourceId')
fi
info "Using infrastructure bucket $BUCKET"

info "Uploading templates to infrastructure bucket $BUCKET"
FILES=(parallelcluster-ui-cognito.yaml parallelcluster-ui.yaml)
for FILE in "${FILES[@]}"; do
  aws s3 cp --region "$REGION" "$INFRASTRUCTURE_DIR/$FILE" "s3://$BUCKET/$FILE"
done
# -----------------------------

# STEP: Setup private ECR repository
ECR_REPOSITORY_NAME="parallelcluster-ui"
info "Settings up private ECR repository $ECR_REPOSITORY_NAME"
if [[ ! $(aws ecr describe-repositories --repository-name $ECR_REPOSITORY_NAME --region "$REGION" 2>/dev/null) ]]; then
  info "The private ECR repository $ECR_REPOSITORY_NAME does not exist, creating ..."
  aws ecr create-repository \
    --region "$REGION" \
    --repository-name $ECR_REPOSITORY_NAME \
    --image-tag-mutability MUTABLE

else
  info "The private ECR repository $ECR_REPOSITORY_NAME already exists"
fi
REPOSITORY_INFO=$(aws ecr describe-repositories \
--region "$REGION" \
--repository-name $ECR_REPOSITORY_NAME \
--query "repositories[0].{arn:repositoryArn,uri:repositoryUri}" \
--output json)
REPOSITORY_ARN=$(echo "$REPOSITORY_INFO" | jq -cr '.arn')
REPOSITORY_ENDPOINT=$(echo "$REPOSITORY_INFO" | jq -cr '.uri' | cut -d '/' -f 1)
info "Using private ECR repository $REPOSITORY_ARN at ECR endpoint $REPOSITORY_ENDPOINT"
# -----------------------------

# STEP: Build image locally and publish to private ECR repository
info "Building image locally and publishing it to private ECR repository"
ECR_IMAGE_TAG=$(date +%Y.%m.%d)
bash "$CURRENT_DIR/build_and_release_image.sh" --ecr-region "$REGION" --ecr-endpoint "$REPOSITORY_ENDPOINT" --tag "$ECR_IMAGE_TAG"
info "Image built with tag '$ECR_IMAGE_TAG' and 'latest'"
# -----------------------------

# STEP: Deploy stack
info "Deploying stack $STACK_NAME"
BUCKET_URL="https://$BUCKET.s3.$REGION.amazonaws.com"

if [[ ! $(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" 2>/dev/null) ]]; then
  info "The stack $STACK_NAME does not exist, creating ..."
  CFN_DEPLOY_COMMAND="create-stack"
  CFN_WAIT_COMMAND="stack-create-complete"
  CFN_CLI_INPUT_YAML_FILE="$INFRASTRUCTURE_DIR/environments/$ENVIRONMENT-cfn-create-args.yaml"
  UPDATE_LAMBDA="false"
else
  info "The stack $STACK_NAME exists, updating ..."
  CFN_DEPLOY_COMMAND="update-stack"
  CFN_WAIT_COMMAND="stack-update-complete"
  CFN_CLI_INPUT_YAML_FILE="$INFRASTRUCTURE_DIR/environments/$ENVIRONMENT-cfn-update-args.yaml"
  UPDATE_LAMBDA="true"
fi

CLI_INPUT_YAML=$(sed "s#BUCKET_URL_PLACEHOLDER#$BUCKET_URL#g" "$CFN_CLI_INPUT_YAML_FILE")

AWS_PAGER="cat" aws cloudformation $CFN_DEPLOY_COMMAND \
  --cli-input-yaml "$CLI_INPUT_YAML" \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

aws cloudformation wait $CFN_WAIT_COMMAND \
  --stack-name "$STACK_NAME" \
  --region "$REGION"

info "Stack $STACK_NAME deployed"

if [[ $UPDATE_LAMBDA == "true" ]]; then
  info "Updating Lambda ..."
  bash "$CURRENT_DIR/build_and_update_lambda.sh" --stack-name "$STACK_NAME" --region "$REGION"
fi

info "Deployment completed!"
#  -----------------------------

# STEP: Retrieve stack details
PCUI_ENDPOINT=$(aws cloudformation describe-stacks \
                  --stack-name "$STACK_NAME" \
                  --region "$REGION" \
                  --query "Stacks[0].Outputs[?OutputKey == 'ParallelClusterUIUrl'].OutputValue" \
                  --output text)

info "PCUI endpoint is $PCUI_ENDPOINT"