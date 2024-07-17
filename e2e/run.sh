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

# Prepare the LND state dir
rm -rf docker/lnd/
mkdir -p docker/lnd
chmod 777 docker/lnd

# Build the app unless skip-build option is provided
if [ "$BUILD_OPTION" == "build" ]; then
  echo "Building the app..."
  # Preserve the existing .env file if it exists
  if [ -f .env ]; then
    cp .env .env.bak
  fi
  cp .env.test.template .env
  yarn e2e:build:$PLATFORM-$BUILD_TYPE
  # Restore the original .env file if it was backed up
  if [ -f .env.bak ]; then
    mv .env.bak .env
  fi
else
  echo "Skipping build..."
fi

# Start the Docker Compose environment
docker compose -f docker/docker-compose.yml up -d

# Wait for Electrum and LND
T=60
while ! (nc -z '127.0.0.1' 60001 && nc -z '127.0.0.1' 10009); do
  if [ $T -le 0 ]; then
    echo "Timeout reached waiting for Electrum and LND. Exiting."
    exit 1
  else
    sleep 1
    (( T-- ))
  fi
done

# Run the E2E tests
yarn e2e:test:$PLATFORM-$BUILD_TYPE --cleanup

# Tear down the Docker environment
docker compose -f docker/docker-compose.yml down -v
