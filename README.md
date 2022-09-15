# Bitkit - Mobile

Bitkit is a self-custodial mobile keychain and wallet application that supports Bitcoin, Lightning Network and Slashtags.

Bitkit includes backup and restore features utilizing [Backpack](https://github.com/synonymdev/backpack-client), and supports [Blocktank](https://github.com/synonymdev/blocktank-client) LSP services.

[![Test status](https://github.com/synonymdev/bitkit/workflows/tests/badge.svg)](https://github.com/synonymdev/bitkit/actions)

### Installation

1. Clone Bitkit:

```shell
git clone git@github.com:synonymdev/bitkit.git && cd bitkit/
```

2. Install Dependencies:

```shell
yarn install
```

3. Set environment variables for development (optional):

```shell
cp .env.development.template .env.development
```

4. Start the project:

```shell
yarn ios
#or
yarn android
```
