#!/bin/bash
set -e
# This script must be run from the root of the project
# The only output on standard error will be the path to the archive file generated
# You can obtain the path of the generated zip archive by doing
#
# $ ARCHIVE_PATH=`build_lambda_archive.sh`
# $ echo $ARCHIVE_PATH
# PROJECT_ROOT/lambda_package/pcui-lambda.zip

PROJECT_ROOT=`realpath $(dirname $(dirname "${BASH_SOURCE[0]}"))`
USAGE="$(basename "$0") [-h] [--target-folder, defaults to 'lambda_package'] [--archive-name, defaults to pcui-lambda.zip]"

print_err() {
  echo $@ 1>&2
}

print_usage() {
  print_err "$USAGE"
}

TARGET_FOLDER='lambda_package'
ARCHIVE_NAME='pcui-lambda.zip'

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


if [ -r "${PROJECT_ROOT}/${TARGET_FOLDER}" ] && ! [ -z "$(ls -A "${PROJECT_ROOT}/${TARGET_FOLDER}")" ]; then
   print_err "${PROJECT_ROOT}/${TARGET_FOLDER} is not empty, please delete contents before proceeding"
   exit 1
fi

print_err "Downloading backend dependencies"
mkdir -p "${PROJECT_ROOT}/${TARGET_FOLDER}" 1>&2
pip install -r "${PROJECT_ROOT}/requirements.txt" -t "${PROJECT_ROOT}/${TARGET_FOLDER}" 1>&2

pushd "${PROJECT_ROOT}/frontend" >> /dev/null
print_err "Exporting static frontend code"

# produce the frontend export inside PROJECT_ROOT/frontend/build
npm run export 1>&2

# enter safe temporary workspace
pushd "${PROJECT_ROOT}/${TARGET_FOLDER}" >> /dev/null

# Add frontend files
mkdir -p frontend/public 1>&2
cp -r "${PROJECT_ROOT}"/frontend/build/* frontend/public 1>&2
cp "${PROJECT_ROOT}"/frontend/resources/attributions/npm-python-attributions.txt frontend/public/license.txt 1>&2

# Add PCUI backend folders
print_err "Adding PCUI files"
cp -r "${PROJECT_ROOT}/awslambda" ./awslambda 1>&2
mv ./awslambda/entrypoint.py lambda_function.py

cp -r "${PROJECT_ROOT}/api" ./api 1>&2
# remove tests from backend code
rm -r ./api/tests 1>&2


# Add main webapp file
cp "${PROJECT_ROOT}/app.py" ./app.py

print_err "Generating the archive '$ARCHIVE_NAME'"
zip -r "$ARCHIVE_NAME" . 1>&2

# Add main lambda handler
zip -g "$ARCHIVE_NAME" lambda_function.py 1>&2

echo `pwd`/"${ARCHIVE_NAME}"

popd >> /dev/null
popd >> /dev/null