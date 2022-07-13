# Bitkit - Mobile
Bitkit is a self-custodial mobile keychain and wallet application that supports Bitcoin, Lightning Network and Slashtags. 

Bitkit includes backup and restore features utilizing [Backpack](https://github.com/synonymdev/backpack-client), and supports [Blocktank](https://github.com/synonymdev/blocktank-client) LSP services.

[![Test status](https://github.com/synonymdev/bitkit/workflows/tests/badge.svg)](https://github.com/synonymdev/bitkit/actions)

### Installation
1. Clone & Build react-native-ldk:
```bash
git clone git@github.com:synonymdev/react-native-ldk.git && cd react-native-ldk/lib && yarn install && yarn build && cd ../../
```

2. Clone BitKit:
```bash
git clone git@github.com:synonymdev/bitkit.git && cd bitkit/
```

3. Install Dependencies:
```bash
yarn install
```

4. Start the project:
```bash
yarn ios
#or
yarn android
```
