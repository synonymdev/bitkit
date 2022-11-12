# Development

Make sure you have [setup your environment for React Native](https://reactnative.dev/docs/environment-setup).

## Installation

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

4. Set environment variables for development (optional)

```shell
cp .env.development.template .env.development
```

5. Start the project

On iOS Simulator:

```shell
yarn ios
```

On Android Emulator:

```shell
yarn android
```

## Troubleshooting

When running into issues there are a couple things to check.

- Clean caches & build folders: `yarn clean`
- Clean simulator cache (iOS): `xcrun simctl erase all`
- Increase emulated device storage (Android): `Android Studio -> Virtual Device Manager -> Edit Device -> Show Advanced Settings -> increase RAM, VM heap and Internal Storage sizes`
