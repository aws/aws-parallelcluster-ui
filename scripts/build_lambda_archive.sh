#!/bin/bash
set -e
# This script must be run from the root of the project
# The archive file will be in the target folder and will have the specified archive name
#
# Example
# $ ./scripts/build_lambda_archive.sh --target-folder lambda_package --archive-name pcui-lambda.zip
#
# After the script's execution, the generated archive will be in ./lambda_package/pcui-lambda.zip


PROJECT_ROOT=`realpath $(dirname $(dirname "${BASH_SOURCE[0]}"))`
USAGE="$(basename "$0") [-h] --target-folder FOLDER --archive-name ARCHIVE_NAME"

print_err() {
  echo $@ 1>&2
}

print_usage() {
  print_err "$USAGE"
}


while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -h)
    print_usage
    exit 1
    ;;
    --target-folder)
    TARGET_FOLDER=$2
    shift
    shift
    ;;
    --archive-name)
    ARCHIVE_NAME=$2
    shift
    shift
    ;;
    *)
    print_usage
    exit 1
    ;;
esac
done

if [ -z "$TARGET_FOLDER" ] || [ -z "$ARCHIVE_NAME" ]; then
  print_err "You must specify both '--target-folder' and '--archive-name' parameters"
  exit 1
fi

if [ -r "${PROJECT_ROOT}/${TARGET_FOLDER}" ] && ! [ -z "$(ls -A "${PROJECT_ROOT}/${TARGET_FOLDER}")" ]; then
   print_err "${PROJECT_ROOT}/${TARGET_FOLDER} is not empty, please delete contents before proceeding"
   exit 1
fi


print_err "Downloading backend dependencies"
mkdir -p "${PROJECT_ROOT}/${TARGET_FOLDER}"
pip install -r "${PROJECT_ROOT}/requirements.txt" -t "${PROJECT_ROOT}/${TARGET_FOLDER}"

pushd "${PROJECT_ROOT}/frontend" >> /dev/null
print_err "Exporting static frontend code"

# produce the frontend export inside PROJECT_ROOT/frontend/build
npm run export

# enter safe temporary workspace
pushd "${PROJECT_ROOT}/${TARGET_FOLDER}" >> /dev/null

# Add frontend files
mkdir -p frontend/public
cp -r "${PROJECT_ROOT}"/frontend/build/* frontend/public
cp "${PROJECT_ROOT}"/frontend/resources/attributions/npm-python-attributions.txt frontend/public/license.txt

# Add PCUI backend folders
print_err "Adding PCUI files"
cp -r "${PROJECT_ROOT}/awslambda" ./awslambda
mv ./awslambda/entrypoint.py lambda_function.py

cp -r "${PROJECT_ROOT}/api" ./api
# remove tests from backend code
rm -r ./api/tests


# Add main webapp file
cp "${PROJECT_ROOT}/app.py" ./app.py

print_err "Generating the archive '$ARCHIVE_NAME'"
zip -r "$ARCHIVE_NAME" .

# Add main lambda handler
zip -g "$ARCHIVE_NAME" lambda_function.py

echo `pwd`/"${ARCHIVE_NAME}"

popd >> /dev/null
popd >> /dev/null