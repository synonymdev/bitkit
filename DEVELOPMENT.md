# Development

Make sure you have [setup your environment for React Native](https://reactnative.dev/docs/environment-setup).

## Installation

1. Clone the repository

```shell
git clone git@github.com:synonymdev/bitkit.git && cd bitkit
```

2. Install dependencies

```shell
yarn install
```

3. Setup iOS or Android dependencies

```shell
yarn setup-ios
```

or

```shell
yarn setup-android
```

4. Start the project

On iOS Simulator:

```shell
yarn ios
```

On Android Emulator:

```shell
yarn android
```

## Testing

Bitkit uses two types of testing: unit and end-to-end (E2E) tests.

Before running tests, you need to install [Docker](https://docs.docker.com/get-docker/) and run bitcoind and the electrum server in regtest mode. You can do this by using the `docker-compose.yml` file from the **docker** directory:

```shell
cd docker
docker compose up
```

After that, you are ready to run the tests:

### 1. Unit tests

```shell
yarn test
```

### 2. End-to-end (E2E) tests

End-to-end tests are powered by [Detox](https://github.com/wix/Detox). Currently, only the iOS Simulator is supported.

To build the tests:

```shell
yarn e2e:build:ios-release
```

To run them:

```shell
yarn e2e:test:ios-release
```

## Troubleshooting

When running into issues there are a couple things to check.

- Clean caches & build folders: `yarn clean`
- Clean simulator cache (iOS): `xcrun simctl erase all`
- Increase emulated device storage (Android): `Android Studio -> Virtual Device Manager -> Edit Device -> Show Advanced Settings -> increase RAM, VM heap and Internal Storage sizes`
