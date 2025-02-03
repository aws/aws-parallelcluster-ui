#!/bin/bash
set -e

USAGE="$(basename "$0") [-h] --tag YYYY.MM.REVISION [--ecr-region REGION, defaults to 'us-east-1'] [--ecr-endpoint PUBLIC_ECR ENDPOINT, defaults to 'public.ecr.aws/pcm']"

print_usage() {
  echo "$USAGE" 1>&2
}

ECR_REPO="parallelcluster-ui"
ECR_REGION="us-east-1"
ECR_ENDPOINT="public.ecr.aws/pcm"

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -h)
    print_usage
    exit 1
    ;;
    --tag)
    TAG=$2
    shift
    shift
    ;;
    --ecr-endpoint)
    ECR_ENDPOINT=$2
    shift
    shift
    ;;
    --ecr-region)
    ECR_REGION=$2
    shift
    shift
    ;;
    *)
    print_usage
    exit 1
    ;;
esac
done


if [ -z $TAG ]; then
  echo 'No `--tag` parameter specified, exiting' 1>&2
  exit 1
elif ! [[ $TAG =~ [0-9]{4}\.(0[1-9]|1[0-2])\.[0-9]+ ]]; then
  echo '`--tag` parameter must be a valid year, month and revision number combo of the following format `YYYY.MM.REVISION`, exiting' 1>&2
  exit 1
fi

echo "[INFO] Logging in ${ECR_ENDPOINT}"
[[ $ECR_ENDPOINT =~ ^public.ecr.aws/.*$ ]] && ECR_COMMAND=ecr-public || ECR_COMMAND=ecr
aws $ECR_COMMAND get-login-password --region "$ECR_REGION" | docker login --username AWS --password-stdin "${ECR_ENDPOINT}"

echo "[INFO] Building frontend"

pushd frontend
if [ ! -d node_modules ]; then
  npm install
fi

echo "[INFO] Building image"
docker build --provenance false --build-arg PUBLIC_URL=/ -t frontend-awslambda .
popd
docker build --provenance false -f Dockerfile.awslambda -t ${ECR_REPO} .

ECR_IMAGE_VERSION_TAGGED=${ECR_ENDPOINT}/${ECR_REPO}:${TAG}
ECR_IMAGE_LATEST_TAGGED=${ECR_ENDPOINT}/${ECR_REPO}:latest

echo "[INFO] Pushing image ${ECR_IMAGE_VERSION_TAGGED} in repository ${ECR_REPO}"

docker tag ${ECR_REPO} ${ECR_IMAGE_VERSION_TAGGED}
docker push ${ECR_IMAGE_VERSION_TAGGED}

docker tag ${ECR_REPO} ${ECR_IMAGE_LATEST_TAGGED}
docker push ${ECR_IMAGE_LATEST_TAGGED}

echo "[INFO] Uploaded: ${ECR_IMAGE_VERSION_TAGGED}, ${ECR_IMAGE_LATEST_TAGGED}"