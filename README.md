<p align="center">
  <a href="https://github.com/synonymdev/bitkit" title="Bitkit">
    <img alt="bitkit" src="./src/assets/bitkit_logo_readme.png" width="150"></img>
  </a>
</p>

<h3 align="center">Bitkit</h3>

---

**⚠️ Bitkit is still in beta. Please use at your own risk.⚠️**

---

## Overview

Bitkit enables users to reclaim their digital life.

Bitkit puts users in control of their money and payments, social profile, contacts, and payment preferences; allows users to authenticate to servers with just a tap; and allows users to stream data from public feeds and web accounts, all within one application. What Bitcoin has done for money and payments, Bitkit also extends to other areas of digital life.

Bitkit is a mobile application available on Android and iOS, and implemented using React-Native.

## The problem

Society, the economy, and the Web have been overcome by oppressive central controls, resulting in censorship, privacy breaches, and monopoly behaviors that stifle the marketplace of goods and ideas. Users need P2P tools that set them free.

## Bitkit's solution

Bitkit offers a Bitcoin wallet that supports both on-chain and lightning transactions. The application runs a custom, non-routing Lightning node created with the [Lightning Development Kit](https://github.com/lightningdevkit) on the user's mobile phone. It requires a connection to an external server running a Bitcoin full node and an Electrum server.

We automatically on-board users to Lightning through the integration of our lightning service provider (LSP) [Blocktank](https://github.com/synonymdev/blocktank-client). Developers can also create their own LSP using Blocktank. In the future, we will support users to connect to their own Lightning and Bitcoin nodes, select different types of LSPs, couple hardware wallets, and manage their own Lightning channels.

Users can back up all their on-chain Bitcoin data with a standard BIP-39 seed. Lightning channel data should automatically be stored on a backup server. The data needs to be encrypted on the client-side before it is sent to a server to ensure privacy. You can view our code [here](https://github.com/synonymdev/bitkit-backup-client).

The other main features Bitkit supports are the creation of social profiles; the importing and managing of contacts; dynamic payment profiles; key-based account logins; and the display of public data feeds and private account data through in-application widgets. You can experiment with these features in our [playground](https://synonym.to/products/slashtags#playground). We currently support three public data widgets: a bitcoin [price feed](https://github.com/synonymdev/slashtags-widget-price-feed), a bitcoin [news feed](https://github.com/synonymdev/slashtags-widget-news-feed), a bitcoin [block data feed](https://github.com/synonymdev/slashtags-widget-bitcoin-feed).

All these additional features are powered by Slashtags: an open-source protocol for creating secure and scalable peer-to-peer applications. You can view our JavaScript-based software development kit which has been used for the Bitkit wallet [here](https://github.com/synonymdev/slashtags).

The Slashtags protocol allows for the creation of cryptographic keypairs, known as "slashtags", derived from the same BIP-39 seed as the user's Bitcoin wallet. Typically these slashtags are associated with networked “drives” known as hyperdrives, which can be discovered, read, and seeded by peers on a network. The group of peers that stores some or all of the drive’s data is known as its swarm.

While much of the power of Slashtags comes via these hyperdrives, the keypairs that can be generated with Slashtags also can have important utility on their own. Bi-lateral, peer to peer authentication between a user and a server can, for example, be realized just on the basis of keypairs.

All Slashtags data is exchanged within a Kademlia-based distributed hash table system.

You can read more about Slashtags on our [website](https://synonym.to/products/slashtags) and on our SDK's [Github page](https://github.com/synonymdev/slashtags). Slashtags predominantly builds on the lower-level functionality of the Hypercore stack. You can learn more about the Hypercore stack [here](https://hypercore-protocol.org/) as well as from the two main Github projects [here](https://github.com/hypercore-protocol) and [here](https://github.com/hyperswarm).

Slashtags user data should be automatically replicated via a [seeding server](https://github.com/synonymdev/slashtag-seeding-server). In this way, user data is always available. In addition, it allows the user to restore all their Slashtags data from just their BIP-39 seed.

## Support

If you are experiencing any problems with Bitkit, please open an issue and use the template provided, or reach out to us on [telegram](https://t.me/bitkitchat).

## Installation

[Download](https://github.com/synonymdev/bitkit/releases) or [Build it from source](./BUILD.md).

## Development

See [Development documentation](./DEVELOPMENT.md).
