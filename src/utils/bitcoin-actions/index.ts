import { Result, err } from '@synonymdev/result';

import * as addressGenerator from 'react-native-address-generator';
import { EAvailableNetwork } from '../networks.ts';

class BitcoinActions {
	private mnemonic: string;
	private bip39Passphrase: string;
	private selectedNetwork: EAvailableNetwork;

	constructor({
		mnemonic = '',
		bip39Passphrase = '',
		selectedNetwork = EAvailableNetwork.bitcoin,
	}) {
		if (!mnemonic) {
			throw new Error('No mnemonic specified in BitcoinActions');
		}
		this.mnemonic = mnemonic;
		this.bip39Passphrase = bip39Passphrase;
		this.selectedNetwork = selectedNetwork;
	}

	async getPrivateKey({
		mnemonic = this.mnemonic,
		bip39Passphrase = this.bip39Passphrase,
		path,
		selectedNetwork = this.selectedNetwork,
	}): Promise<Result<string>> {
		try {
			if (!mnemonic) {
				return err('No mnemonic specified');
			}
			if (!path) {
				return err('No path specified');
			}
			return addressGenerator.getPrivateKey({
				mnemonic,
				path,
				network: selectedNetwork,
				passphrase: bip39Passphrase,
			});
		} catch (e) {
			return err(e);
		}
	}

	async getAddress({
		path = '',
		selectedNetwork = this.selectedNetwork,
	}): Promise<
		Result<{
			address: string;
			path: string;
			publicKey: string;
		}>
	> {
		try {
			if (!path) {
				return err('No path specified');
			}
			if (!this.mnemonic) {
				return err('No mnemonic specified in bitcoin-actions.');
			}
			if (!selectedNetwork) {
				return err('No network specified');
			}
			return addressGenerator.getAddress({
				mnemonic: this.mnemonic,
				path,
				network: selectedNetwork,
			});
		} catch (e) {
			return err(e);
		}
	}

	async getScriptHash({
		address = '',
		selectedNetwork = this.selectedNetwork,
	}): Promise<Result<string>> {
		try {
			if (!address) {
				return err('No address specified');
			}
			if (!selectedNetwork) {
				return err('No network specified');
			}
			return addressGenerator.getScriptHash({
				address,
				network: selectedNetwork,
			});
		} catch (e) {
			return err(e);
		}
	}
}

export default BitcoinActions;
