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
# Usage: ./scripts/setup-env.sh [ENVIRONMENT]
# Example: ./scripts/setup-env.sh demo

CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

ENVIRONMENTS_DIR=$(realpath "$CURRENT_DIR/../infrastructure/environments")

source "$CURRENT_DIR/common.sh"

ENVIRONMENT=$1

[[ -z $ENVIRONMENT ]] && fail "Missing required argument: ENVIRONMENT"

info "Selected environment: $ENVIRONMENT"

if [[ $(ls $ENVIRONMENTS_DIR/$ENVIRONMENT-*) ]]; then
  warn "Configuration files for the environment $ENVIRONMENT already exist. Nothing to do."
  exit 0
fi

info "Creating environment files"
cp "$ENVIRONMENTS_DIR/demo-variables.sh" "$ENVIRONMENTS_DIR/$ENVIRONMENT-variables.sh"
chmod +x "$ENVIRONMENTS_DIR/$ENVIRONMENT-variables.sh"
cp "$ENVIRONMENTS_DIR/demo-cfn-update-args.yaml" "$ENVIRONMENTS_DIR/$ENVIRONMENT-cfn-create-args.sh"
cp "$ENVIRONMENTS_DIR/demo-cfn-update-args.yaml" "$ENVIRONMENTS_DIR/$ENVIRONMENT-cfn-update-args.sh"

info "Environment files created! Check out $ENVIRONMENTS_DIR"