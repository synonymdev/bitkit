# Building Bitkit from source

## Setup

1. Clone the repository

```shell
git clone git@github.com:synonymdev/bitkit.git && cd bitkit
```

2. Switch Node version

Switch to the Node.js version defined in `.nvmrc`. If `nvm` (or similiar) is installed on your system you can run `nvm use`.

3. Install dependencies

```shell
yarn install
```

4. Setup iOS or Android dependencies

```shell
yarn setup-ios
```

or

```shell
yarn setup-android
```

## Build

- For iOS: Open the `ios` folder in Xcode to build the project.
- For Android `yarn bundle` to build the app

### Regtest Builds for Testing

For Android: run `yarn bundle:regtest` to build the regtest app variant for release.

For iOS:

1. Run `yarn bundle:regtest:ios`
2. In Xcode, switch to the `bitkit.regtest` scheme
3. Proceed the same as for the default scheme to build/archive the app.
