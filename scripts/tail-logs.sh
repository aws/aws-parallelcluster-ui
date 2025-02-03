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
# Usage: ./scripts/tail.sh [ENVIRONMENT]
# Example: ./scripts/tail.sh demo

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

INFRASTRUCTURE_DIR="$CURRENT_DIR/../infrastructure"

source "$CURRENT_DIR/common.sh"

ENVIRONMENT=$1

[[ -z $ENVIRONMENT ]] && fail "Missing required argument: ENVIRONMENT"

info "Selected environment: $ENVIRONMENT"

source "$INFRASTRUCTURE_DIR/environments/$ENVIRONMENT-variables.sh"

info "Retrieving log group"
LOG_GROUP=$(aws cloudformation describe-stack-resources \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --logical-resource-id ParallelClusterUILambdaLogGroup \
  --output text \
  --query 'StackResources[0].PhysicalResourceId')

aws logs tail $LOG_GROUP --region $REGION --follow --format short