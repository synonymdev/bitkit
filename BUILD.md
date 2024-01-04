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

For Android: `yarn bundle`.

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

### Regtest Builds for Testing

Building for release the app variant which has the `Bitcoin Regtest` network selected by default
involves configuration both inside React Native code via dotenv files and in each native projects.
To facilitate this and ensure the 2 configurations are in sync, a script is involved to create
an overriding dotenv file (`.env.production.local`), which should be manually removed immediately after
to avoid accidentally building the main app defaulting to Regtest.

#### For Android:

1. Run `yarn regtest:set`
2. Run `yarn bundle:regtest` to build the regtest app variant for release
3. Run `yarn regtest:unset`.

#### For iOS:

1. Run `yarn regtest:set`
2. In Xcode, switch to the `bitkit.regtest` scheme, then Create archive and export for distribution
3. Run `yarn regtest:unset`.
