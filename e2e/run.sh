#!/bin/bash

# Navigate up a level if currently in 'e2e'
if [ "$(basename "$PWD")" == "e2e" ]; then
  cd ..
fi

# Check current directory is 'bitkit' project root
if [ "$(basename "$PWD")" != "bitkit" ]; then
  echo "Not at bitkit project root. Exiting."
  exit 1
fi

# Check if the necessary arguments are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <platform> <build|skip-build> [debug|release]"
  echo "Where <platform> is either 'android' or 'ios'"
  echo "      <build|skip-build> specifies whether to build or skip the build step"
  echo "      [debug|release] is an optional argument for the build type, defaulting to 'release'"
  exit 1
fi

PLATFORM=$1
BUILD_OPTION=$2
BUILD_TYPE=${3:-release}

# Check if the platform is valid
if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
  echo "Invalid platform: $PLATFORM"
  echo "Please specify either 'android' or 'ios'"
  exit 1
fi

# Check if the build option is valid
if [[ "$BUILD_OPTION" != "build" && "$BUILD_OPTION" != "skip-build" ]]; then
  echo "Invalid build option: $BUILD_OPTION"
  echo "Please specify either 'build' or 'skip-build'"
  exit 1
fi

# Check if the build type is valid
if [[ "$BUILD_TYPE" != "debug" && "$BUILD_TYPE" != "release" ]]; then
  echo "Invalid build type: $BUILD_TYPE"
  echo "Please specify either 'debug' or 'release'"
  exit 1
fi

echo "Using platform: $PLATFORM"
echo "Using build type: $BUILD_TYPE"

# Set up the environment variables
cp .env.test.template .env

# Prepare the LND state dir
rm -rf docker/lnd/
mkdir -p docker/lnd
chmod 777 docker/lnd

# Build the release unless skip-build option is provided
if [ "$BUILD_OPTION" == "build" ]; then
  echo "Building the app..."
  yarn e2e:build:$PLATFORM-$BUILD_TYPE
else
  echo "Skipping build..."
fi

# Start the Docker Compose environment
docker compose -f docker/docker-compose.yml up -d
sleep 2 # short wait for Electrum and LND

# Run the E2E tests
yarn e2e:test:$PLATFORM-$BUILD_TYPE --cleanup

# Tear down the Docker environment
docker compose -f docker/docker-compose.yml down -v
