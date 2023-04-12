dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Building Lambda layer runtime..."
lambdalayer=lambdabuild
docker build -f Dockerfile.lambdalayer -t ${lambdalayer} .

echo "Creating Lambda archive..."
output=${dir}/output
mkdir -p ${output}
docker run -t -v ${output}:/output/ ${lambdalayer}
cp ${output}/layer.zip ${dir}/../pcui.zip
rm -fr ${output}