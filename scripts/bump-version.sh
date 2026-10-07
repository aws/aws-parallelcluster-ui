#!/bin/bash
set -e

USAGE="$(basename "$0") [-h] --version YYYY.MM.REVISION"

print_usage() {
  echo "$USAGE" 1>&2
}

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -h)
    print_usage
    exit 0
    ;;
    --version)
    VERSION=$2
    shift
    shift
    ;;
    *)
    print_usage
    exit 1
    ;;
esac
done

if [[ ! "$VERSION" =~ ^[0-9]{4}\.[0-9]{2}\.[0-9]+$ ]]; then
  echo "Error: Invalid version format '$VERSION'. Expected format: YYYY.MM.REVISION (e.g., 2026.10.0)" 1>&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/../infrastructure/parallelcluster-ui.yaml"

CURRENT_VERSION=$(sed -nE 's/^ *Version: ([0-9]{4}\.[0-9]{2}\.[0-9]+) # format YYYY\.MM\.REVISION.*$/\1/p' "$TEMPLATE")
if [[ -z "$CURRENT_VERSION" ]]; then
  echo "Error: Unable to find current version in $TEMPLATE" 1>&2
  exit 1
fi

echo "Bumping PCUI version to $VERSION (from $CURRENT_VERSION)"

sed -E -i.bak \
  -e "s|(public\.ecr\.aws/pcm/parallelcluster-ui:)[0-9]{4}\.[0-9]{2}\.[0-9]+|\1$VERSION|" \
  -e "s|^( *Version: )[0-9]{4}\.[0-9]{2}\.[0-9]+( # format YYYY\.MM\.REVISION)|\1$VERSION\2|" \
  "$TEMPLATE"
rm -f "$TEMPLATE.bak"
