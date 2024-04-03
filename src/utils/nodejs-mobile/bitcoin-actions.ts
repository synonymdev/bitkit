import { NativeModules } from 'react-native';
import { err, ok, Result } from '@synonymdev/result';

const { BitcoinAddressGenerator } = NativeModules;
class BitcoinActions {
	private mnemonic: string;
	private bip39Passphrase: string;
	private selectedNetwork: string;

	constructor() {
		this.mnemonic = '';
		this.bip39Passphrase = '';
		this.selectedNetwork = '';
	}

	setup({
		mnemonic = this.mnemonic,
		bip39Passphrase = this.bip39Passphrase,
		selectedNetwork = this.selectedNetwork,
	}): Result<string> {
		try {
			if (!mnemonic) {
				return err('No mnemonic specified');
			}
			if (!selectedNetwork) {
				return err('No network specified');
			}
			this.mnemonic = mnemonic;
			this.selectedNetwork = selectedNetwork;
			this.bip39Passphrase = bip39Passphrase;
			return ok('Successfully setup bitcoin-actions.');
		} catch (e) {
			return err(e);
		}
	}

	getPrivateKey({
		mnemonic = this.mnemonic,
		bip39Passphrase = this.bip39Passphrase,
		path,
		selectedNetwork = this.selectedNetwork,
	}): Promise<Result<string>> {
		return new Promise((resolve): void => {
			try {
				if (!mnemonic) {
					resolve(err('No mnemonic specified'));
				}
				if (!selectedNetwork) {
					resolve(err('No network specified'));
				}
				if (!path) {
					resolve(err('No path specified'));
				}
				BitcoinAddressGenerator.getPrivateKey(
					mnemonic,
					path,
					selectedNetwork,
					bip39Passphrase,
					(message) => {
						if (!message) {
							return resolve(err('Unable to retrieve private key.'));
						}
						resolve(ok(message));
					},
				);
			} catch (e) {
				resolve(err(e));
			}
		});
	}

	getAddress({ path = '', selectedNetwork = this.selectedNetwork }): Promise<
		Result<{
			address: string;
			path: string;
			publicKey: string;
		}>
	> {
		return new Promise((resolve): void => {
			try {
				if (!path) {
					resolve(err('No path specified'));
				}
				if (!this.mnemonic) {
					resolve(err('No mnemonic specified in bitcoin-actions.'));
				}
				if (!selectedNetwork) {
					resolve(err('No network specified'));
				}
				BitcoinAddressGenerator.getAddress(
					this.mnemonic,
					path,
					selectedNetwork,
					(message) => {
						if (!message) {
							return resolve(err('Unable to retrieve address.'));
						}
						resolve(ok(JSON.parse(message)));
					},
				);
			} catch (e) {
				resolve(err(e));
			}
		});
	}

	getScriptHash({
		address = '',
		selectedNetwork = this.selectedNetwork,
	}): Promise<Result<string>> {
		return new Promise((resolve): void => {
			try {
				if (!address) {
					resolve(err('No address specified'));
				}
				if (!selectedNetwork) {
					resolve(err('No network specified'));
				}
				BitcoinAddressGenerator.getScriptHash(
					address,
					selectedNetwork,
					(message) => {
						if (!message) {
							return resolve(err('Unable to retrieve script hash.'));
						}
						resolve(ok(message));
					},
				);
			} catch (e) {
				resolve(err(e));
			}
		});
	}
}

export default BitcoinActions;
