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

## Build

For iOS: Open the `ios` folder in Xcode to build the project.

For Android: `yarn bundle`
