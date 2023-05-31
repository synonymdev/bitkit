# Bitkit

https://github.com/synonymdev/bitkit/assets/5798170/99807c8a-2cb8-41f5-810f-6146e633e95b

**⚠️ Beta software that may put your money at risk.**

**⚠️ We recommend using only small amounts.**

**⚠️ Don’t use the same seed on multiple devices.**

[⬇ Android - Download latest APK](https://github.com/synonymdev/bitkit/releases)

[⬇ iPhone - Download latest TestFlight app](https://testflight.apple.com/join/lGXhnwcC)


## Overview

Reclaim your digital life with Bitkit. 

Bitkit offers on-chain and lightning transactions, as well as user-controlled social profiles and contacts; easy payments to contacts; key-based log-ins; and data streaming from private and public feeds into widgets. All these latter features have been built using [Slashtags](https://slashtags.to/).  

Synonym's mission is for users to have control over their own data and operate in a Web that is censorship-resistant, private, and free from walled gardens. Bitkit is Synonym’s crack at harmonizing such digital autonomy with a great user experience.

Bitkit is a mobile application available on Android and iOS, and implemented using React-Native.

## The problem

Society, the economy, and the Web suffer from oppressive central controls, resulting in censorship, privacy breaches, and monopoly behaviors. Users need P2P tools that set them free.

## Bitkit's solution

Bitkit offers a Bitcoin wallet that supports both on-chain and lightning transactions. The application runs a custom, non-routing Lightning node created with the [Lightning Development Kit](https://github.com/lightningdevkit) on the user's mobile phone. By default you connect to Synonym's Electrum-Bitcoin Core server, but you can also connect to your own server. We on-board users to Lightning through our lightning service provider (LSP) [Blocktank](https://github.com/synonymdev/blocktank-client). In the future, we will also enable connections to other LSPs and peers on the network. 

Users can back up their Bitcoin and Lightning keys with a standard BIP-39 seed and optional password. Lightning channel data is automatically replicated on our a backup server. The data is encrypted on the client-side before it is sent to our server to ensure privacy. You can view our code [here](https://github.com/synonymdev/bitkit-backup-client).

The other main features Bitkit supports are as follows: 

* 📱 Social profiles and contacts
* 💸 Easy payments to profiles
* 🔑 Key-based account logins
* 📊 Streaming of private and public data feeds into widgets

All these additional features are powered by Slashtags: a collection of software modules and specifications that complements the Bitcoin and Lightning stacks in the building of peer-to-peer applications, specifically to enable decentralized identities and web-of-trust reputation systems. You can view our JavaScript-based software development kit which has been used for the Bitkit wallet [here](https://github.com/synonymdev/slashtags).

You can experiment with Bitkit's Slashtags features in our [playground](https://slashtags.to/#playground). We currently support four public data widgets: 

* 📈 [Bitcoin Price Feed](https://github.com/synonymdev/slashtags-widget-price-feed) - [📲 Add to your phone](https://slashtags.to/playground/price)
* 📰 [Bitcoin News Feed](https://github.com/synonymdev/slashtags-widget-news-feed) - [📲 Add to your phone](https://slashtags.to/playground/headlines)
* 📊 [Bitcoin Block Feed](https://github.com/synonymdev/slashtags-widget-bitcoin-feed) - [📲 Add to your phone](https://slashtags.to/playground/blocks)
* 📚 [Bitcoin Facts Feed](https://github.com/synonymdev/slashtags-widget-facts-feed) - [📲 Add to your phone](https://slashtags.to/playground/facts)

Slashtags user data is automatically replicated via our [seeding server](https://github.com/synonymdev/slashtag-seeding-server). In this way, user data is always available. In addition, it allows the user to restore all their Slashtags data from just their BIP-39 seed and optional password.

## Support

If you are experiencing any problems with Bitkit, please open an issue and use the template provided, or reach out to us on [Telegram](https://t.me/bitkitchat).

## Installation

[Download](https://github.com/synonymdev/bitkit/releases) or [build it from source](./BUILD.md).

## Development

See [development documentation](./DEVELOPMENT.md).
