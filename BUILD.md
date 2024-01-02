# Building Bitkit from source

## Setup

1. Clone the repository

```shell
git clone git@github.com:synonymdev/bitkit.git && cd bitkit
```

2. Switch Node version

Switch to the Node.js version defined in `.nvmrc`. If `nvm` (or similar) is installed on your system you can run `nvm use`.

3. Install dependencies

```shell
yarn install
```

## Build

### iOS

For iOS: Open the `ios` folder in Xcode to build the project.

### Android

- `yarn bundle` to build the app
- `yarn bundle:regtest` to build the regtest app variant

Moreover, to build the Android APK, it is necessary to configure a signing store to sign
the apk, as explained by [React Docs](https://reactnative.dev/docs/signed-apk-android).

It is recommend to use the already presented `debug.store` in `android/app`.
Add the following lines to `~/.gradle/gradle.properties`:

```shell
BITKIT_UPLOAD_STORE_FILE=debug.keystore
BITKIT_UPLOAD_STORE_PASSWORD=android
BITKIT_UPLOAD_KEY_ALIAS=androiddebugkey
BITKIT_UPLOAD_KEY_PASSWORD=android
```
