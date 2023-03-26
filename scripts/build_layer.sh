#!/bin/bash -e
# Copyright 2023 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
# with the License. A copy of the License is located at http://aws.amazon.com/apache2.0/
# or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
# limitations under the License.

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Determine container runtime, preferring finch
container_runtime=docker
if command -v finch &> /dev/null
then
    container_runtime="finch"
fi
echo "Using ${container_runtime} as container runtime."

# build front-end
pushd frontend
if [ ! -d node_modules ]; then
  npm install
fi
${container_runtime} build --build-arg PUBLIC_URL=/ -t frontend .
popd

# build the lambda build environment runtime
echo "Building Lambda layer runtime..."
lambdalayer=lambda_build
${container_runtime} build -f Dockerfile.lambdalayer -t ${lambdalayer} .

echo "Creating Lambda archive..."
# For some reason the container runtime doesn't like this type of temporary directory...
# output=$(mktemp -d 2>/dev/null || mktemp -d -t 'output')
output=${dir}/output
mkdir -p ${output}
${container_runtime} run -t -v ${output}:/output/ --rm ${lambdalayer}
cp ${output}/layer.zip ${dir}/layer.zip
rm -fr ${output}
