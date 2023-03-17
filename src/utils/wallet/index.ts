import { InteractionManager } from 'react-native';
import { getAddressInfo } from 'bitcoin-address-validation';
import { constants } from '@synonymdev/slashtags-sdk';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import { err, ok, Result } from '@synonymdev/result';

import { networks, TAvailableNetworks } from '../networks';
import {
	defaultKeyDerivationPath,
	getDefaultWalletShape,
	defaultWalletStoreShape,
	TAddressIndexInfo,
} from '../../store/shapes/wallet';
import {
	EPaymentType,
	IAddresses,
	IAddress,
	ICreateWallet,
	IWallets,
	IWallet,
	IFormattedTransactions,
	IFormattedTransaction,
	IKeyDerivationPath,
	IOutput,
	IUtxo,
	EAddressType,
	TKeyDerivationAccount,
	TKeyDerivationAccountType,
	TKeyDerivationPurpose,
	IAddressTypes,
	IKeyDerivationPathData,
	TWalletName,
	TKeyDerivationCoinType,
	TKeyDerivationChange,
} from '../../store/types/wallet';
import {
	IGetAddress,
	IGenerateAddresses,
	IGetInfoFromAddressPath,
	IGenerateAddressesResponse,
	IGetAddressResponse,
} from '../types';
import { getKeychainValue, btcToSats, setKeychainValue } from '../helpers';
import {
	getLightningStore,
	getSettingsStore,
	getUiStore,
	getWalletStore,
} from '../../store/helpers';
import {
	addAddresses,
	clearUtxos,
	generateNewReceiveAddress,
	resetAddressIndexes,
	setZeroIndexAddresses,
	updateAddressIndexes,
	updateExchangeRates,
	updateTransactions,
	updateUtxos,
} from '../../store/actions/wallet';
import {
	ICustomElectrumPeer,
	TCoinSelectPreference,
} from '../../store/types/settings';
import { updateActivityList } from '../../store/actions/activity';
import { getByteCount } from './transactions';
import {
	getAddressHistory,
	getTransactions,
	getTransactionsFromInputs,
	isConnectedElectrum,
	subscribeToAddresses,
	TTxResult,
} from './electrum';
import { getDisplayValues } from '../exchange-rate';
import { IDisplayValues } from '../exchange-rate/types';
import { IncludeBalances } from '../../hooks/wallet';
import { invokeNodeJsMethod } from '../nodejs-mobile';
import { DefaultNodeJsMethodsShape } from '../nodejs-mobile/shapes';
import { refreshLdk } from '../lightning';
import {
	BITKIT_WALLET_SEED_HASH_PREFIX,
	GENERATE_ADDRESS_AMOUNT,
	CHUNK_LIMIT,
} from './constants';
import { moveMetaIncTxTags } from '../../store/actions/metadata';
import { refreshOrdersList } from '../../store/actions/blocktank';
import { IDefaultLightningShape } from '../../store/types/lightning';
import { objectKeys } from '../objectKeys';

export const refreshWallet = async ({
	onchain = true,
	lightning = true,
	scanAllAddresses = false, // If set to false, on-chain scanning will adhere to the gap limit (20).
	updateAllAddressTypes = false, // If set to true, Bitkit will generate, check and update all available address types.
	showNotification = true, // Whether to show newTxPrompt on new incoming transactions.
	selectedWallet,
	selectedNetwork,
}: {
	onchain?: boolean;
	lightning?: boolean;
	scanAllAddresses?: boolean;
	updateAllAddressTypes?: boolean;
	showNotification?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
} = {}): Promise<Result<string>> => {
	try {
		// wait for interactions/animations to be completed
		await new Promise((resolve) =>
			InteractionManager.runAfterInteractions(() => resolve(null)),
		);
		const isConnectedToElectrum = getUiStore().isConnectedToElectrum;
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (onchain) {
			let addressType: EAddressType | undefined;
			if (!updateAllAddressTypes) {
				addressType = getSelectedAddressType({
					selectedNetwork,
					selectedWallet,
				});
			}
			await updateAddressIndexes({
				selectedWallet,
				selectedNetwork,
				addressType,
			});
			if (isConnectedToElectrum) {
				await Promise.all([
					subscribeToAddresses({
						selectedWallet,
						selectedNetwork,
					}),
					updateUtxos({
						selectedWallet,
						selectedNetwork,
						scanAllAddresses,
					}),
					updateTransactions({
						scanAllAddresses,
						showNotification,
						selectedWallet,
						selectedNetwork,
					}),
				]);
			}

			updateExchangeRates().then();
		}

		if (onchain) {
			await setZeroIndexAddresses({
				selectedWallet,
				selectedNetwork,
			});
		}

		if (lightning) {
			await refreshLdk({ selectedWallet, selectedNetwork });
			await refreshOrdersList();
		}

		if (onchain || lightning) {
			await updateActivityList();
			await moveMetaIncTxTags();
		}
		return ok('');
	} catch (e) {
		return err(e);
	}
};

/**
 * Generates a series of addresses based on the specified params.
 * @async
 * @param {string} selectedWallet - Wallet ID
 * @param {number} [addressAmount] - Number of addresses to generate.
 * @param {number} [changeAddressAmount] - Number of changeAddresses to generate.
 * @param {number} [addressIndex] - What index to start generating addresses at.
 * @param {number} [changeAddressIndex] - What index to start generating changeAddresses at.
 * @param {string} [selectedNetwork] - What network to generate addresses for (bitcoin or bitcoinTestnet).
 * @param {string} [keyDerivationPath] - The path to generate addresses from.
 * @param [TKeyDerivationAccountType] - Specifies which account to generate an address from (onchain).
 * @param {string} [addressType] - Determines what type of address to generate (p2pkh, p2sh, p2wpkh).
 */
export const generateAddresses = async ({
	selectedWallet,
	addressAmount = 10,
	changeAddressAmount = 10,
	addressIndex = 0,
	changeAddressIndex = 0,
	selectedNetwork,
	keyDerivationPath = { ...defaultKeyDerivationPath },
	accountType = 'onchain',
	addressType,
}: IGenerateAddresses): Promise<Result<IGenerateAddressesResponse>> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!addressType) {
			addressType = getSelectedAddressType({ selectedNetwork, selectedWallet });
		}

		const type = addressType;
		const addresses = {} as IAddresses;
		const changeAddresses = {} as IAddresses;
		const addressArray = new Array(addressAmount).fill(null);
		const changeAddressArray = new Array(changeAddressAmount).fill(null);

		await Promise.all(
			addressArray.map(async (_item, i) => {
				try {
					const index = i + addressIndex;
					let path = { ...keyDerivationPath };
					path.addressIndex = `${index}`;
					const addressPath = formatKeyDerivationPath({
						path,
						selectedNetwork,
						accountType,
						changeAddress: false,
						addressIndex: `${index}`,
					});
					if (addressPath.isErr()) {
						return err(addressPath.error.message);
					}
					const address = await getAddress({
						path: addressPath.value.pathString,
						selectedNetwork,
						type,
					});
					if (address.isErr()) {
						return err(address.error.message);
					}
					const scriptHash = await getScriptHash(
						address.value.address,
						selectedNetwork,
					);
					if (!scriptHash) {
						return err('Unable to get script hash.');
					}
					addresses[scriptHash] = {
						...address.value,
						index,
						scriptHash,
					};
				} catch {}
			}),
		);

		await Promise.all(
			changeAddressArray.map(async (_item, i) => {
				try {
					const index = i + changeAddressIndex;
					const path = { ...keyDerivationPath };
					path.addressIndex = `${index}`;
					const changeAddressPath = formatKeyDerivationPath({
						path,
						selectedNetwork,
						accountType,
						changeAddress: true,
						addressIndex: `${index}`,
					});
					if (changeAddressPath.isErr()) {
						return err(changeAddressPath.error.message);
					}

					const address = await getAddress({
						path: changeAddressPath.value.pathString,
						selectedNetwork,
						type,
					});
					if (address.isErr()) {
						return err(address.error.message);
					}
					const scriptHash = await getScriptHash(
						address.value.address,
						selectedNetwork,
					);
					if (!scriptHash) {
						return err('Unable to get script hash.');
					}
					changeAddresses[scriptHash] = {
						...address.value,
						index,
						scriptHash,
					};
				} catch {}
			}),
		);

		return ok({ addresses, changeAddresses });
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns private key for the provided address data.
 * @param {IAddress} addressData
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Promise<Result<string>>}
 */
export const getPrivateKey = async ({
	addressData,
	selectedNetwork,
}: {
	addressData: IAddress;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	try {
		if (!addressData) {
			return err('No addressContent specified.');
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}

		const getPrivateKeyShapeShape = DefaultNodeJsMethodsShape.getPrivateKey();
		getPrivateKeyShapeShape.data.path = addressData.path;
		getPrivateKeyShapeShape.data.selectedNetwork = selectedNetwork;
		const getPrivateKeyResponse = await invokeNodeJsMethod(
			getPrivateKeyShapeShape,
		);
		if (getPrivateKeyResponse.error) {
			return err(getPrivateKeyResponse.value);
		}
		return ok(getPrivateKeyResponse.value);
	} catch (e) {
		return err(e);
	}
};

const slashtagsPrimaryKeyKeyChainName = (seedHash: string = ''): string =>
	'SLASHTAGS_PRIMARYKEY/' + seedHash;

export const getSlashtagsPrimaryKey = async (
	seedHash: string,
): Promise<{ error: boolean; data: string }> => {
	return getKeychainValue({ key: slashtagsPrimaryKeyKeyChainName(seedHash) });
};

export const slashtagsPrimaryKey = async (seed: Buffer): Promise<string> => {
	const network = networks.bitcoin;
	const root = bip32.fromSeed(seed, network);

	const path = constants.PRIMARY_KEY_DERIVATION_PATH;
	const keyPair = root.derivePath(path);

	return keyPair.privateKey?.toString('hex') as string;
};

const setKeychainSlashtagsPrimaryKey = async (seed: Buffer): Promise<void> => {
	const primaryKey = await slashtagsPrimaryKey(seed);
	await setKeychainValue({
		key: slashtagsPrimaryKeyKeyChainName(seedHash(seed)),
		value: primaryKey,
	});
};

export const seedHash = (seed: Buffer): string => {
	return bitcoin.crypto
		.sha256(Buffer.concat([BITKIT_WALLET_SEED_HASH_PREFIX, seed]))
		.toString('hex');
};

export const keyDerivationAccountTypes: {
	onchain: TKeyDerivationAccount;
} = {
	onchain: '0',
};

/**
 * Returns the account param of the key derivation path based on the specified account type.
 * @param {TKeyDerivationAccountType} [accountType]
 * @return {TKeyDerivationAccount}
 */
export const getKeyDerivationAccount = (
	accountType: TKeyDerivationAccountType = 'onchain',
): TKeyDerivationAccount => {
	return keyDerivationAccountTypes[accountType];
};
/**
 * Formats and returns the provided derivation path string and object.
 * @param {IKeyDerivationPath} path
 * @param {TKeyDerivationPurpose | string} [purpose]
 * @param {boolean} [changeAddress]
 * @param {TKeyDerivationAccountType} [accountType]
 * @param {string} [addressIndex]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Result<{IKeyDerivationPathData}>} Derivation Path Data
 */
export const formatKeyDerivationPath = ({
	path,
	purpose,
	selectedNetwork,
	accountType = 'onchain',
	changeAddress = false,
	addressIndex = '0',
}: {
	path: IKeyDerivationPath | string;
	purpose?: TKeyDerivationPurpose;
	selectedNetwork?: TAvailableNetworks;
	accountType?: TKeyDerivationAccountType;
	changeAddress?: boolean;
	addressIndex?: string;
}): Result<IKeyDerivationPathData> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}

		if (typeof path === 'string') {
			const derivationPathResponse = getKeyDerivationPathObject({
				path,
				purpose,
				selectedNetwork,
				accountType,
				changeAddress,
				addressIndex,
			});
			if (derivationPathResponse.isErr()) {
				return err(derivationPathResponse.error.message);
			}
			path = derivationPathResponse.value;
		}
		const pathObject = path;

		const pathStringResponse = getKeyDerivationPathString({
			path: pathObject,
			purpose,
			selectedNetwork,
			accountType,
			changeAddress,
			addressIndex,
		});
		if (pathStringResponse.isErr()) {
			return err(pathStringResponse.error.message);
		}
		const pathString = pathStringResponse.value;
		return ok({ pathObject, pathString });
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the preferred derivation path for the specified wallet and network.
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {string}
 */
export const getKeyDerivationPath = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): IKeyDerivationPath => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const addressTypes = getAddressTypes();
		const addressType = getSelectedAddressType({
			selectedNetwork,
			selectedWallet,
		});
		const path = formatKeyDerivationPath({
			path: addressTypes[addressType].path,
			selectedNetwork,
		});
		if (path.isErr()) {
			return defaultKeyDerivationPath;
		}
		return path.value.pathObject;
	} catch (e) {
		return e;
	}
};

/**
 * Get onchain mnemonic phrase for a given wallet from storage.
 * @async
 * @param {TWalletName} [selectedWallet]
 * @return {Promise<Result<string>>}
 */
export const getMnemonicPhrase = async (
	selectedWallet?: TWalletName,
): Promise<Result<string>> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const response = await getKeychainValue({ key: selectedWallet });
		if (response.error) {
			return err(response.data);
		}
		return ok(response.data);
	} catch (e) {
		return err(e);
	}
};

/**
 * Generate a mnemonic phrase using a string as entropy.
 * @param {string} str
 * @return {string}
 */
export const generateMnemonicPhraseFromEntropy = (str: string): string => {
	// @ts-ignore
	const hash = getSha256(str);
	return bip39.entropyToMnemonic(hash);
};

/**
 * Derive multiple mnemonic phrases by appending a
 * descriptive string to the original mnemonic.
 * @param {string} mnemonic
 */
export const deriveMnemonicPhrases = async (
	mnemonic: string,
): Promise<
	Result<{
		onchain: string;
		lightning: string;
		tokens: string;
	}>
> => {
	if (!mnemonic) {
		return err('Please provide a mnemonic phrase.');
	}
	const isValid = validateMnemonic(mnemonic);
	if (!isValid) {
		return err('Mnemonic provided is not valid.');
	}
	const onchain = mnemonic;
	const lightning = generateMnemonicPhraseFromEntropy(`${mnemonic}lightning`);
	const tokens = generateMnemonicPhraseFromEntropy(`${mnemonic}tokens`);
	return ok({ onchain, lightning, tokens });
};

/**
 * Returns sha256 hash of string.
 * @param {Buffer} buff
 * @return {Buffer}
 */
export const getSha256 = (buff: Buffer): Buffer => {
	return bitcoin.crypto.sha256(buff);
};

/**
 * Generate a mnemonic phrase.
 * @async
 * @param {number} strength
 * @return {Promise<string>}
 */
export const generateMnemonic = async (strength = 128): Promise<string> => {
	try {
		const data = DefaultNodeJsMethodsShape.generateMnemonic();
		data.data.strength = strength;
		const generatedMnemonic = await invokeNodeJsMethod<string>(data);
		if (generatedMnemonic.error) {
			return '';
		}
		return generatedMnemonic.value;
	} catch (e) {
		return '';
	}
};

/**
 * Get bip39 passphrase for a specified wallet.
 * @async
 * @param {TWalletName} selectedWallet
 * @return {Promise<string>}
 */
export const getBip39Passphrase = async (
	selectedWallet?: TWalletName,
): Promise<string> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const key = `${selectedWallet}passphrase`;
		const bip39PassphraseResult = await getKeychainValue({ key });
		if (!bip39PassphraseResult.error && bip39PassphraseResult.data) {
			return bip39PassphraseResult.data;
		}
		return '';
	} catch {
		return '';
	}
};

export const getSeed = async (
	selectedWallet: TWalletName,
): Promise<Result<Buffer>> => {
	const getMnemonicPhraseResponse = await getMnemonicPhrase(selectedWallet);
	if (getMnemonicPhraseResponse.isErr()) {
		return err(getMnemonicPhraseResponse.error.message);
	}

	//Attempt to acquire the bip39Passphrase if available
	const bip39Passphrase = await getBip39Passphrase(selectedWallet);

	const mnemonic = getMnemonicPhraseResponse.value;
	return ok(await bip39.mnemonicToSeed(mnemonic, bip39Passphrase));
};

/**
 * Get scriptHash for a given address
 * @param {string} address
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {string}
 */
export const getScriptHash = async (
	address: string,
	selectedNetwork?: TAvailableNetworks,
): Promise<string> => {
	try {
		if (!address) {
			return '';
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const data = DefaultNodeJsMethodsShape.getScriptHash();
		data.data.address = address;
		data.data.selectedNetwork = selectedNetwork;
		const getScriptHashResponse = await invokeNodeJsMethod<string>(data);
		if (getScriptHashResponse.error) {
			return '';
		}
		return getScriptHashResponse.value;
	} catch {
		return '';
	}
};

/**
 * Get address for a given keyPair, network and type.
 * @param {string} path
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {EAddressType} type - Determines what type of address to generate (p2pkh, p2sh, p2wpkh).
 * @return {string}
 */
export const getAddress = async ({
	path,
	selectedNetwork,
	type,
}: IGetAddress): Promise<Result<IGetAddressResponse>> => {
	if (!path) {
		return err('No path specified');
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	try {
		const data = DefaultNodeJsMethodsShape.getAddress();
		data.data.path = path;
		data.data.type = type;
		data.data.selectedNetwork = selectedNetwork;
		const addressResponse = await invokeNodeJsMethod<IGetAddressResponse>(data);
		return ok(addressResponse.value);
	} catch (e) {
		return err(e);
	}
};

/**
 * Get info from an address path "m/49'/0'/0'/0/1"
 * @param {string} path - The path to derive information from.
 * @return {{error: <boolean>, isChangeAddress: <number>, addressIndex: <number>, data: <string>}}
 */
export const getInfoFromAddressPath = (path = ''): IGetInfoFromAddressPath => {
	try {
		if (path === '') {
			return { error: true, data: 'No path specified' };
		}
		let isChangeAddress = false;
		const lastIndex = path.lastIndexOf('/');
		const addressIndex = Number(path.substr(lastIndex + 1));
		const firstIndex = path.lastIndexOf('/', lastIndex - 1);
		const addressType = path.substr(firstIndex + 1, lastIndex - firstIndex - 1);
		if (Number(addressType) === 1) {
			isChangeAddress = true;
		}
		return { error: false, isChangeAddress, addressIndex };
	} catch (e) {
		console.log(e);
		return { error: true, isChangeAddress: false, addressIndex: 0, data: e };
	}
};

/**
 * Determine if a given mnemonic is valid.
 * @param {string} mnemonic - The mnemonic to validate.
 * @return {boolean}
 */
export const validateMnemonic = (mnemonic: string): boolean => {
	try {
		return bip39.validateMnemonic(mnemonic);
	} catch (error) {
		console.error('error validating mnemonic', error);
		return false;
	}
};

/**
 * Get the current Bitcoin balance in sats. (Confirmed+Unconfirmed)
 * @param {string} selectedWallet
 * @param {string} selectedNetwork
 * @return number - Will always return balance in sats.
 */
export const getOnChainBalance = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
} = {}): number => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	return getWalletStore().wallets[selectedWallet]?.balance[selectedNetwork];
};

/**
 *
 * @param {string} asset
 * @return {string}
 */
export const getAssetTicker = (asset = 'bitcoin'): string => {
	try {
		switch (asset) {
			case 'bitcoin':
				return 'BTC';
			case 'bitcoinTestnet':
				return 'BTC';
			default:
				return '';
		}
	} catch {
		return '';
	}
};

/**
 * This method will compare a set of specified addresses to the currently stored addresses and remove any duplicates.
 * @param {IAddresses} addresses
 * @param {IAddresses} changeAddresses
 * @param {selectedWallet} selectedWallet
 * @param {selectedNetwork} selectedNetwork
 */
export const removeDuplicateAddresses = async ({
	addresses = {},
	changeAddresses = {},
	selectedWallet,
	selectedNetwork,
}: {
	addresses?: IAddresses;
	changeAddresses?: IAddresses;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<IGenerateAddressesResponse>> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const { currentWallet } = getCurrentWallet({
			selectedWallet,
			selectedNetwork,
		});
		const currentAddressTypeContent = currentWallet.addresses[selectedNetwork];
		const currentChangeAddressTypeContent =
			currentWallet.changeAddresses[selectedNetwork];

		//Remove any duplicate addresses.
		await Promise.all([
			objectKeys(currentAddressTypeContent).map(async (addressType) => {
				await Promise.all(
					objectKeys(addresses).map((scriptHash) => {
						if (scriptHash in currentAddressTypeContent[addressType]) {
							delete addresses[scriptHash];
						}
					}),
				);
			}),

			objectKeys(currentChangeAddressTypeContent).map(async (addressType) => {
				await Promise.all(
					objectKeys(changeAddresses).map((scriptHash) => {
						if (scriptHash in currentChangeAddressTypeContent[addressType]) {
							delete changeAddresses[scriptHash];
						}
					}),
				);
			}),
		]);

		return ok({ addresses, changeAddresses });
	} catch (e) {
		return err(e);
	}
};

interface ITxHashes extends TTxResult {
	scriptHash: string;
}

interface IGetNextAvailableAddressResponse {
	addressIndex: IAddress;
	lastUsedAddressIndex: IAddress;
	changeAddressIndex: IAddress;
	lastUsedChangeAddressIndex: IAddress;
}

interface IGetNextAvailableAddress {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	addressType?: EAddressType;
}

export const getNextAvailableAddress = async ({
	selectedWallet,
	selectedNetwork,
	addressType,
}: IGetNextAvailableAddress): Promise<
	Result<IGetNextAvailableAddressResponse>
> => {
	const isConnected = await isConnectedElectrum();
	if (!isConnected) {
		return err('Not connected to Electrum Server.');
	}

	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const { currentWallet } = getCurrentWallet({
			selectedNetwork,
			selectedWallet,
		});
		if (!addressType) {
			addressType = getSelectedAddressType({
				selectedNetwork,
				selectedWallet,
			});
		}
		const addressTypes = getAddressTypes();
		const { path } = addressTypes[addressType];

		const result = formatKeyDerivationPath({ path, selectedNetwork });
		if (result.isErr()) {
			return err(result.error.message);
		}
		const { pathObject: keyDerivationPath } = result.value;

		//The currently known/stored address index.
		let addressIndex = currentWallet.addressIndex[selectedNetwork][addressType];
		let lastUsedAddressIndex =
			currentWallet.lastUsedAddressIndex[selectedNetwork][addressType];
		let changeAddressIndex =
			currentWallet.changeAddressIndex[selectedNetwork][addressType];
		let lastUsedChangeAddressIndex =
			currentWallet.lastUsedChangeAddressIndex[selectedNetwork][addressType];

		if (!addressIndex.address) {
			const generatedAddresses = await generateAddresses({
				selectedWallet,
				selectedNetwork,
				addressAmount: GENERATE_ADDRESS_AMOUNT,
				changeAddressAmount: 0,
				keyDerivationPath,
				addressType,
			});
			if (generatedAddresses.isErr()) {
				return err(generatedAddresses.error);
			}
			const addresses = generatedAddresses.value.addresses;
			const sorted = Object.values(addresses).sort((a, b) => a.index - b.index);
			addressIndex = sorted[0];
		}

		if (!changeAddressIndex.address) {
			const generatedAddresses = await generateAddresses({
				selectedWallet,
				selectedNetwork,
				addressAmount: 0,
				changeAddressAmount: GENERATE_ADDRESS_AMOUNT,
				keyDerivationPath,
				addressType,
			});
			if (generatedAddresses.isErr()) {
				return err(generatedAddresses.error);
			}
			const addresses = generatedAddresses.value.changeAddresses;
			const sorted = Object.values(addresses).sort((a, b) => a.index - b.index);
			changeAddressIndex = sorted[0];
		}

		let addresses = currentWallet.addresses[selectedNetwork][addressType];
		let changeAddresses =
			currentWallet.changeAddresses[selectedNetwork][addressType];

		//How many addresses/changeAddresses are currently stored
		const addressCount = Object.values(addresses).length;
		const changeAddressCount = Object.values(changeAddresses).length;

		/*
		 *	Create more addresses if none exist or the highest address index matches the current address count
		 */
		if (addressCount <= 0 || addressIndex.index === addressCount) {
			const newAddresses = await addAddresses({
				addressAmount: GENERATE_ADDRESS_AMOUNT,
				changeAddressAmount: 0,
				addressIndex: addressIndex.index,
				changeAddressIndex: 0,
				selectedNetwork,
				selectedWallet,
				keyDerivationPath,
				addressType,
			});
			if (!newAddresses.isErr()) {
				addresses = newAddresses.value.addresses;
			}
		}

		/*
		 *	Create more change addresses if none exist or the highest change address index matches the current
		 *	change address count
		 */
		if (
			changeAddressCount <= 0 ||
			changeAddressIndex.index === changeAddressCount
		) {
			const newChangeAddresses = await addAddresses({
				addressAmount: 0,
				changeAddressAmount: GENERATE_ADDRESS_AMOUNT,
				addressIndex: 0,
				changeAddressIndex: changeAddressIndex.index,
				selectedNetwork,
				selectedWallet,
				keyDerivationPath,
				addressType,
			});
			if (!newChangeAddresses.isErr()) {
				changeAddresses = newChangeAddresses.value.changeAddresses;
			}
		}

		//Store all addresses that are to be searched and used in this method.
		let allAddresses = Object.values(addresses).filter(
			({ index }) => index >= addressIndex.index,
		);
		let addressesToScan = allAddresses;

		//Store all change addresses that are to be searched and used in this method.
		let allChangeAddresses = Object.values(changeAddresses).filter(
			({ index }) => index >= changeAddressIndex.index,
		);
		let changeAddressesToScan = allChangeAddresses;

		//Prep for batch request
		let combinedAddressesToScan = [
			...addressesToScan,
			...changeAddressesToScan,
		];

		let foundLastUsedAddress = false;
		let foundLastUsedChangeAddress = false;
		let addressHasBeenUsed = false;
		let changeAddressHasBeenUsed = false;

		// If an error occurs, return last known/available indexes.
		const lastKnownIndexes = ok({
			addressIndex,
			lastUsedAddressIndex,
			changeAddressIndex,
			lastUsedChangeAddressIndex,
		});

		while (!foundLastUsedAddress || !foundLastUsedChangeAddress) {
			//Check if transactions are pending in the mempool.
			const addressHistory = await getAddressHistory({
				scriptHashes: combinedAddressesToScan,
				selectedNetwork,
				selectedWallet,
			});

			if (addressHistory.isErr()) {
				console.log(addressHistory.error.message);
				return lastKnownIndexes;
			}

			const txHashes = addressHistory.value;

			const highestUsedIndex = getHighestUsedIndexFromTxHashes({
				txHashes,
				addresses,
				changeAddresses,
				addressIndex,
				changeAddressIndex,
			});
			if (highestUsedIndex.isErr()) {
				console.log(highestUsedIndex.error.message);
				return lastKnownIndexes;
			}

			addressIndex = highestUsedIndex.value.addressIndex;
			changeAddressIndex = highestUsedIndex.value.changeAddressIndex;
			if (highestUsedIndex.value.foundAddressIndex) {
				addressHasBeenUsed = true;
			}
			if (highestUsedIndex.value.foundChangeAddressIndex) {
				changeAddressHasBeenUsed = true;
			}

			const highestStoredIndex = getHighestStoredAddressIndex({
				selectedNetwork,
				selectedWallet,
				addressType,
			});

			if (highestStoredIndex.isErr()) {
				console.log(highestStoredIndex.error.message);
				return lastKnownIndexes;
			}

			const {
				addressIndex: highestUsedAddressIndex,
				changeAddressIndex: highestUsedChangeAddressIndex,
			} = highestUsedIndex.value;
			const {
				addressIndex: highestStoredAddressIndex,
				changeAddressIndex: highestStoredChangeAddressIndex,
			} = highestStoredIndex.value;

			if (highestUsedAddressIndex.index < highestStoredAddressIndex.index) {
				foundLastUsedAddress = true;
			}

			if (
				highestUsedChangeAddressIndex.index <
				highestStoredChangeAddressIndex.index
			) {
				foundLastUsedChangeAddress = true;
			}

			if (foundLastUsedAddress && foundLastUsedChangeAddress) {
				//Increase index by one if the current index was found in a txHash or is greater than the previous index.
				let newAddressIndex = addressIndex.index;
				if (
					highestUsedAddressIndex.index > addressIndex.index ||
					addressHasBeenUsed
				) {
					const index = highestUsedAddressIndex.index;
					if (
						highestUsedAddressIndex &&
						index >= 0 &&
						highestUsedIndex.value.foundAddressIndex
					) {
						lastUsedAddressIndex = highestUsedAddressIndex;
					}
					newAddressIndex = index >= 0 ? index + 1 : index;
				}

				let newChangeAddressIndex = changeAddressIndex.index;
				if (
					highestUsedChangeAddressIndex.index > changeAddressIndex.index ||
					changeAddressHasBeenUsed
				) {
					const index = highestUsedChangeAddressIndex.index;
					if (
						highestUsedChangeAddressIndex &&
						index >= 0 &&
						highestUsedIndex.value.foundChangeAddressIndex
					) {
						lastUsedChangeAddressIndex = highestUsedChangeAddressIndex;
					}
					newChangeAddressIndex = index >= 0 ? index + 1 : index;
				}

				//Find and return the new address index.
				const nextAvailableAddress = Object.values(allAddresses).find(
					({ index }) => index === newAddressIndex,
				);
				//Find and return the new change address index.
				const nextAvailableChangeAddress = Object.values(
					allChangeAddresses,
				).find(({ index }) => index === newChangeAddressIndex);
				if (!nextAvailableAddress || !nextAvailableChangeAddress) {
					return lastKnownIndexes;
				}
				return ok({
					addressIndex: nextAvailableAddress,
					lastUsedAddressIndex,
					changeAddressIndex: nextAvailableChangeAddress,
					lastUsedChangeAddressIndex,
				});
			}

			//Create receiving addresses for the next round
			if (!foundLastUsedAddress) {
				const newAddresses = await addAddresses({
					addressAmount: GENERATE_ADDRESS_AMOUNT,
					changeAddressAmount: 0,
					addressIndex: highestStoredIndex.value.addressIndex.index,
					changeAddressIndex: 0,
					selectedNetwork,
					selectedWallet,
					keyDerivationPath,
					addressType,
				});
				if (!newAddresses.isErr()) {
					addresses = newAddresses.value.addresses || {};
				}
			}
			//Create change addresses for the next round
			if (!foundLastUsedChangeAddress) {
				const newChangeAddresses = await addAddresses({
					addressAmount: 0,
					changeAddressAmount: GENERATE_ADDRESS_AMOUNT,
					addressIndex: 0,
					changeAddressIndex: highestStoredIndex.value.changeAddressIndex.index,
					selectedNetwork,
					selectedWallet,
					keyDerivationPath,
					addressType,
				});
				if (!newChangeAddresses.isErr()) {
					changeAddresses = newChangeAddresses.value.changeAddresses || {};
				}
			}

			// Store newly created addresses to scan in the next round.
			addressesToScan = Object.values(addresses);
			changeAddressesToScan = Object.values(changeAddresses);
			combinedAddressesToScan = [...addressesToScan, ...changeAddressesToScan];
			// Store the newly created addresses used for this method.
			allAddresses = [...allAddresses, ...addressesToScan];
			allChangeAddresses = [...allChangeAddresses, ...changeAddressesToScan];
		}

		return lastKnownIndexes;
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

interface IIndexes {
	addressIndex: IAddress;
	changeAddressIndex: IAddress;
	foundAddressIndex: boolean;
	foundChangeAddressIndex: boolean;
}

export const getHighestUsedIndexFromTxHashes = ({
	txHashes,
	addresses,
	changeAddresses,
	addressIndex,
	changeAddressIndex,
}: {
	txHashes: ITxHashes[];
	addresses: IAddresses;
	changeAddresses: IAddresses;
	addressIndex: IAddress;
	changeAddressIndex: IAddress;
}): Result<IIndexes> => {
	try {
		let foundAddressIndex = false;
		let foundChangeAddressIndex = false;

		txHashes = txHashes.flat();
		txHashes.forEach(({ scriptHash }) => {
			if (
				scriptHash in addresses &&
				addresses[scriptHash].index >= addressIndex.index
			) {
				foundAddressIndex = true;
				addressIndex = addresses[scriptHash];
			} else if (
				scriptHash in changeAddresses &&
				changeAddresses[scriptHash].index >= changeAddressIndex.index
			) {
				foundChangeAddressIndex = true;
				changeAddressIndex = changeAddresses[scriptHash];
			}
		});

		const data = {
			addressIndex,
			changeAddressIndex,
			foundAddressIndex,
			foundChangeAddressIndex,
		};

		return ok(data);
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the highest address and change address index stored in the app for the specified wallet and network.
 */
export const getHighestStoredAddressIndex = ({
	selectedWallet = defaultWalletStoreShape.selectedWallet,
	selectedNetwork = defaultWalletStoreShape.selectedNetwork,
	addressType,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
	addressType: EAddressType;
}): Result<{
	addressIndex: IAddress;
	changeAddressIndex: IAddress;
}> => {
	try {
		const { currentWallet } = getCurrentWallet({
			selectedWallet,
			selectedNetwork,
		});
		const addresses = currentWallet.addresses[selectedNetwork][addressType];
		const changeAddresses =
			currentWallet.changeAddresses[selectedNetwork][addressType];

		const addressIndex = Object.values(addresses).reduce((prev, current) => {
			return prev.index > current.index ? prev : current;
		});

		const changeAddressIndex = Object.values(changeAddresses).reduce(
			(prev, current) => (prev.index > current.index ? prev : current),
		);

		return ok({ addressIndex, changeAddressIndex });
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the currently selected network (bitcoin | bitcoinTestnet).
 * @return {TAvailableNetworks}
 */
export const getSelectedNetwork = (): TAvailableNetworks => {
	return getWalletStore().selectedNetwork;
};

/**
 * Returns the currently selected address type (p2pkh | p2sh | p2wpkh | p2tr).
 * @returns {EAddressType}
 */
export const getSelectedAddressType = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
} = {}): EAddressType => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	const wallet = getWalletStore().wallets[selectedWallet];
	if (wallet?.addressType[selectedNetwork]) {
		return wallet.addressType[selectedNetwork];
	} else {
		return getDefaultWalletShape().addressType[selectedNetwork];
	}
};

/**
 * Returns the currently selected wallet (Ex: 'wallet0').
 * @return {TWalletName}
 */
export const getSelectedWallet = (): TWalletName => {
	return getWalletStore().selectedWallet;
};

/**
 * Returns all state data for the currently selected wallet.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @return {{ currentWallet: IWallet, currentLightningNode: IDefaultLightningShape, selectedWallet: TWalletName, selectedNetwork: TAvailableNetworks }}
 */
export const getCurrentWallet = ({
	selectedNetwork,
	selectedWallet,
}: {
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
} = {}): {
	currentWallet: IWallet;
	currentLightningNode: IDefaultLightningShape;
	selectedNetwork: TAvailableNetworks;
	selectedWallet: TWalletName;
} => {
	const wallet = getWalletStore();
	const lightning = getLightningStore();
	if (!selectedNetwork) {
		selectedNetwork = wallet.selectedNetwork;
	}
	if (!selectedWallet) {
		selectedWallet = wallet.selectedWallet;
	}
	const currentWallet = wallet.wallets[selectedWallet];
	const currentLightningNode = lightning.nodes[selectedWallet];
	return {
		currentWallet,
		currentLightningNode,
		selectedNetwork,
		selectedWallet,
	};
};

export const getOnChainTransactions = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
}): IFormattedTransactions => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	return (
		getWalletStore().wallets[selectedWallet]?.transactions[selectedNetwork] ??
		{}
	);
};

/**
 * @param {string} txid
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Result<IFormattedTransaction>}
 */
export const getTransactionById = ({
	txid,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Result<IFormattedTransaction> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const transactions = getOnChainTransactions({
		selectedNetwork,
		selectedWallet,
	});
	if (txid in transactions) {
		return ok(transactions[txid]);
	} else {
		return err('Unable to locate the specified txid.');
	}
};

export interface ITransaction<T> {
	id: number;
	jsonrpc: string;
	param: string;
	data: T;
	result: {
		blockhash: string;
		blocktime: number;
		confirmations: number;
		hash: string;
		hex: string;
		locktime: number;
		size: number;
		txid: string;
		version: number;
		vin: IVin[];
		vout: IVout[];
		vsize: number;
		weight: number;
		time?: number;
	};
}

export interface ITxHash {
	tx_hash: string;
}

type InputData = {
	[key: string]: {
		addresses: string[];
		value: number;
	};
};

export const getInputData = async ({
	inputs,
	selectedNetwork,
}: {
	inputs: { tx_hash: string; vout: number }[];
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<InputData>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const inputData: InputData = {};

		for (let i = 0; i < inputs.length; i += CHUNK_LIMIT) {
			const chunk = inputs.slice(i, i + CHUNK_LIMIT);

			const getTransactionsResponse = await getTransactionsFromInputs({
				txHashes: chunk,
				selectedNetwork,
			});
			if (getTransactionsResponse.isErr()) {
				return err(getTransactionsResponse.error.message);
			}
			getTransactionsResponse.value.data.map(({ data, result }) => {
				const vout = result.vout[data.vout];
				const addresses = vout.scriptPubKey.addresses
					? vout.scriptPubKey.addresses
					: vout.scriptPubKey.address
					? [vout.scriptPubKey.address]
					: [];
				const value = vout.value;
				const key = `${data.tx_hash}${vout.n}`;
				inputData[key] = { addresses, value };
			});
		}
		return ok(inputData);
	} catch (e) {
		return err(e);
	}
};

export const formatTransactions = async ({
	transactions,
	selectedNetwork,
	selectedWallet,
}: {
	transactions: ITransaction<IUtxo>[];
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
}): Promise<Result<IFormattedTransactions>> => {
	if (transactions.length < 1) {
		return ok({});
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const { currentWallet } = getCurrentWallet({
		selectedNetwork,
		selectedWallet,
	});

	// Batch and pre-fetch input data.
	const inputs: { tx_hash: string; vout: number }[] = [];
	transactions.forEach(({ result }) => {
		result.vin.forEach((v) => inputs.push({ tx_hash: v.txid, vout: v.vout }));
	});
	const inputDataResponse = await getInputData({
		selectedNetwork,
		inputs,
	});
	if (inputDataResponse.isErr()) {
		return err(inputDataResponse.error.message);
	}
	const addressTypes = objectKeys(getAddressTypes());
	const inputData = inputDataResponse.value;
	const currentAddresses = currentWallet.addresses[selectedNetwork];
	const currentChangeAddresses = currentWallet.changeAddresses[selectedNetwork];

	let addresses = {} as IAddresses;
	let changeAddresses = {} as IAddresses;

	addressTypes.map((addressType) => {
		// Check if addresses of this type have been generated. If not, skip.
		if (Object.keys(currentAddresses[addressType])?.length > 0) {
			addresses = {
				...addresses,
				...currentAddresses[addressType],
			};
		}
		// Check if change addresses of this type have been generated. If not, skip.
		if (Object.keys(currentChangeAddresses[addressType])?.length > 0) {
			changeAddresses = {
				...changeAddresses,
				...currentChangeAddresses[addressType],
			};
		}
	});

	// Create combined address/change-address object for easier/faster reference later on.
	const combinedAddressObj: { [key: string]: IAddress } = {};
	[...Object.values(addresses), ...Object.values(changeAddresses)].map(
		(data) => {
			combinedAddressObj[data.address] = data;
		},
	);

	const formattedTransactions: IFormattedTransactions = {};
	transactions.map(async ({ data, result }) => {
		if (!result.txid) {
			return;
		}

		let totalInputValue = 0; // Total value of all inputs.
		let matchedInputValue = 0; // Total value of all inputs with addresses that belong to this wallet.
		let totalOutputValue = 0; // Total value of all outputs.
		let matchedOutputValue = 0; // Total value of all outputs with addresses that belong to this wallet.
		let messages: string[] = []; // Array of OP_RETURN messages.

		//Iterate over each input
		result.vin.map(({ txid, scriptSig, vout }) => {
			//Push any OP_RETURN messages to messages array
			try {
				const asm = scriptSig.asm;
				if (asm !== '' && asm.includes('OP_RETURN')) {
					const OpReturnMessages = decodeOpReturnMessage(asm);
					messages = messages.concat(OpReturnMessages);
				}
			} catch {}

			const { addresses: _addresses, value } = inputData[`${txid}${vout}`];
			totalInputValue = totalInputValue + value;
			_addresses.map((address) => {
				if (address in combinedAddressObj) {
					matchedInputValue = matchedInputValue + value;
				}
			});
		});

		//Iterate over each output
		result.vout.map(({ scriptPubKey, value }) => {
			const _addresses = scriptPubKey.addresses
				? scriptPubKey.addresses
				: scriptPubKey.address
				? [scriptPubKey.address]
				: [];
			totalOutputValue = totalOutputValue + value;
			_addresses.map((address) => {
				if (address in combinedAddressObj) {
					matchedOutputValue = matchedOutputValue + value;
				}
			});
		});

		const txid = result.txid;
		const type =
			matchedInputValue > matchedOutputValue
				? EPaymentType.sent
				: EPaymentType.received;
		const totalMatchedValue = matchedOutputValue - matchedInputValue;
		const value = Number(totalMatchedValue.toFixed(8));
		const totalValue = totalInputValue - totalOutputValue;
		const fee = Number(Math.abs(totalValue).toFixed(8));
		const satsPerByte = btcToSats(fee) / result.vsize;
		const { address, height, scriptHash } = data;
		let timestamp = Date.now();

		if (height > 0 && result.blocktime) {
			timestamp = result.blocktime * 1000;
		}

		formattedTransactions[txid] = {
			address,
			height,
			scriptHash,
			totalInputValue,
			matchedInputValue,
			totalOutputValue,
			matchedOutputValue,
			fee,
			satsPerByte,
			type,
			value,
			txid,
			messages,
			timestamp,
			vin: result.vin,
		};
	});

	return ok(formattedTransactions);
};

//Returns an array of messages from an OP_RETURN message
export const decodeOpReturnMessage = (opReturn = ''): string[] => {
	let messages: string[] = [];
	try {
		//Remove OP_RETURN from the string & trim the string.
		if (opReturn.includes('OP_RETURN')) {
			opReturn = opReturn.replace('OP_RETURN', '');
			opReturn = opReturn.trim();
		}

		const regex = /[0-9A-Fa-f]{6}/g;
		//Separate the string into an array based upon a space and insert each message into an array to be returned
		const data = opReturn.split(' ');
		data.forEach((msg) => {
			try {
				//Ensure the message is in fact a hex
				if (regex.test(msg)) {
					const message = Buffer.from(msg, 'hex').toString();
					messages.push(message);
				}
			} catch {}
		});
		return messages;
	} catch (e) {
		console.log(e);
		return messages;
	}
};

export const getCustomElectrumPeers = ({
	selectedNetwork,
}: {
	selectedNetwork?: TAvailableNetworks;
}): ICustomElectrumPeer[] => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	return getSettingsStore().customElectrumPeers[selectedNetwork];
};

export interface IVin {
	scriptSig: {
		asm: string;
		hex: string;
	};
	sequence: number;
	txid: string;
	txinwitness: string[];
	vout: number;
}

export interface IVout {
	n: number; //0
	scriptPubKey: {
		addresses?: string[];
		address?: string;
		asm: string;
		hex: string;
		reqSigs?: number;
		type?: string;
	};
	value: number;
}

// TODO: Update ICreateTransaction to match this pattern.
export interface IRbfData {
	outputs: IOutput[];
	selectedWallet: TWalletName;
	balance: number;
	selectedNetwork: TAvailableNetworks;
	addressType: EAddressType;
	fee: number; // Total fee in sats.
	inputs: IUtxo[];
	message: string;
}

/**
 * Using a tx_hash this method will return the necessary data to create a
 * replace-by-fee transaction for any 0-conf, RBF-enabled tx.
 * @param txHash
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */

export const getRbfData = async ({
	txHash,
	selectedWallet,
	selectedNetwork,
}: {
	txHash: ITxHash;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<IRbfData>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const txResponse = await getTransactions({
		txHashes: [txHash],
		selectedNetwork,
	});
	if (txResponse.isErr()) {
		return err(txResponse.error.message);
	}
	const txData = txResponse.value.data;

	const wallet = getWalletStore();
	const addressTypes = objectKeys(getAddressTypes());
	const addresses = wallet.wallets[selectedWallet].addresses[selectedNetwork];
	const changeAddresses =
		wallet.wallets[selectedWallet].changeAddresses[selectedNetwork];

	let allAddresses = {} as IAddresses;
	let allChangeAddresses = {} as IAddresses;

	await Promise.all(
		addressTypes.map((addressType) => {
			allAddresses = {
				...allAddresses,
				...addresses[addressType],
				...changeAddresses[addressType],
			};
			allChangeAddresses = {
				...allChangeAddresses,
				...changeAddresses[addressType],
			};
		}),
	);

	let changeAddressData: IOutput = {
		address: '',
		value: 0,
		index: 0,
	};
	let inputs: IUtxo[] = [];
	let address: string = '';
	let scriptHash = '';
	let path = '';
	let value: number = 0;
	let addressType = EAddressType.p2wpkh;
	let outputs: IOutput[] = [];
	let message: string = '';
	let inputTotal = 0;
	let outputTotal = 0;
	let fee = 0;

	const insAndOuts = await Promise.all(
		txData.map(({ result }) => {
			const vin = result.vin ?? [];
			const vout = result.vout ?? [];
			return { vins: vin, vouts: vout };
		}),
	);
	const { vins, vouts } = insAndOuts[0];
	for (let i = 0; i < vins.length; i++) {
		try {
			const input = vins[i];
			const txId = input.txid;
			const tx = await getTransactions({
				txHashes: [{ tx_hash: txId }],
				selectedNetwork,
			});
			if (tx.isErr()) {
				return err(tx.error.message);
			}
			if (tx.value.data[0].data.height > 0) {
				return err('Transaction is already confirmed. Unable to RBF.');
			}
			const txVout = tx.value.data[0].result.vout[input.vout];
			if (txVout.scriptPubKey?.address) {
				address = txVout.scriptPubKey.address;
			} else if (
				txVout.scriptPubKey?.addresses &&
				txVout.scriptPubKey.addresses.length
			) {
				address = txVout.scriptPubKey.addresses[0];
			}
			if (!address) {
				continue;
			}
			scriptHash = await getScriptHash(address, selectedNetwork);
			// Check that we are in possession of this scriptHash.
			if (!(scriptHash in allAddresses)) {
				// This output did not come from us.
				continue;
			}
			path = allAddresses[scriptHash].path;
			value = btcToSats(txVout.value);
			inputs.push({
				tx_hash: input.txid,
				index: input.vout,
				tx_pos: input.vout,
				height: 0,
				address,
				scriptHash,
				path,
				value,
			});
			if (value) {
				inputTotal = inputTotal + value;
			}
		} catch (e) {
			console.log(e);
		}
	}
	for (let i = 0; i < vouts.length; i++) {
		const vout = vouts[i];
		const voutValue = btcToSats(vout.value);
		if (vout.scriptPubKey?.addresses) {
			address = vout.scriptPubKey.addresses[0];
		} else if (vout.scriptPubKey?.address) {
			address = vout.scriptPubKey.address;
		} else {
			try {
				if (vout.scriptPubKey.asm.includes('OP_RETURN')) {
					message = decodeOpReturnMessage(vout.scriptPubKey.asm)[0] || '';
				}
			} catch (e) {}
		}
		if (!address) {
			continue;
		}
		const changeAddressScriptHash = await getScriptHash(
			address,
			selectedNetwork,
		);

		// If the address scripthash matches one of our address scripthashes, add it accordingly. Otherwise, add it as another output.
		if (Object.keys(allAddresses).includes(changeAddressScriptHash)) {
			changeAddressData = {
				address,
				value: voutValue,
				index: i,
			};
		} else {
			const index = outputs?.length ?? 0;
			outputs.push({
				address,
				value: voutValue,
				index,
			});
			outputTotal = outputTotal + voutValue;
		}
	}

	if (!changeAddressData?.address && outputs.length >= 2) {
		/*
		 * Unable to determine change address.
		 * Performing an RBF could divert funds from the incorrect output.
		 *
		 * It's very possible that this tx sent the max amount of sats to a foreign/unknown address.
		 * Instead of pulling sats from that output to accommodate the higher fee (reducing how much the recipient receives)
		 * suggest a CPFP transaction.
		 */
		return err('cpfp');
	}

	if (outputTotal > inputTotal) {
		return err('Outputs should not be greater than the inputs.');
	}
	fee = Number(inputTotal - (changeAddressData?.value ?? 0) - outputTotal);
	//outputs = outputs.filter((o) => o);

	return ok({
		selectedWallet,
		changeAddress: changeAddressData.address,
		inputs,
		balance: inputTotal,
		outputs,
		fee,
		selectedNetwork,
		message,
		addressType,
		rbf: true,
	});
};

/**
 * Converts IRbfData to IBitcoinTransactionData.
 * CURRENTLY NOT USED
 * @param {IRbfData} data
 */
// export const formatRbfData = async (
// 	data: IRbfData,
// ): Promise<Partial<IBitcoinTransactionData>> => {
// 	const { selectedWallet, inputs, outputs, fee, selectedNetwork, message } =
// 		data;

// 	let changeAddress: undefined | string;
// 	let satsPerByte = 1;
// 	let selectedFeeId = EFeeId.none;
// 	let transactionSize = TRANSACTION_DEFAULTS.baseTransactionSize; //In bytes (250 is about normal)
// 	let label = ''; // User set label for a given transaction.

// 	const { currentWallet } = getCurrentWallet({
// 		selectedWallet,
// 		selectedNetwork,
// 	});
// 	const changeAddressesObj = currentWallet.changeAddresses[selectedNetwork];
// 	const changeAddresses = Object.values(changeAddressesObj).map(
// 		({ address }) => address.address,
// 	);

// 	let newOutputs = outputs;
// 	outputs.map(({ address }, index) => {
// 		if (address && changeAddresses.includes(address)) {
// 			changeAddress = address;
// 			newOutputs.splice(index, 1);
// 		}
// 	});

// 	let newFee = 0;
// 	let newSatsPerByte = satsPerByte;
// 	while (fee > newFee) {
// 		newFee = getTotalFee({
// 			selectedWallet,
// 			satsPerByte: newSatsPerByte,
// 			selectedNetwork,
// 			message,
// 		});
// 		newSatsPerByte = newSatsPerByte + 1;
// 	}

// 	const newFiatAmount = getTransactionOutputValue({ outputs });

// 	return {
// 		changeAddress: changeAddress || '',
// 		message,
// 		label,
// 		outputs: newOutputs,
// 		inputs,
// 		fee: newFee,
// 		satsPerByte: newSatsPerByte,
// 		fiatAmount: newFiatAmount,
// 		selectedFeeId,
// 		transactionSize,
// 	};
// };

/**
 * Generates a newly specified wallet.
 * @param {string} [wallet]
 * @param {number} [addressAmount]
 * @param {number} [changeAddressAmount]
 * @param {string} [mnemonic]
 * @param {string} [bip39Passphrase]
 * @param {EAddressType} [addressTypes]
 * @return {Promise<Result<IWallets>>}
 */
export const createDefaultWallet = async ({
	walletName = getDefaultWalletShape().id,
	addressAmount = GENERATE_ADDRESS_AMOUNT,
	changeAddressAmount = GENERATE_ADDRESS_AMOUNT,
	mnemonic = '',
	bip39Passphrase = '',
	addressTypes,
	selectedNetwork,
}: ICreateWallet): Promise<Result<IWallets>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!addressTypes) {
			// if nothing else specified use only Native Segwit by default
			addressTypes = { p2wpkh: getAddressTypes().p2wpkh };
		}
		const selectedAddressType = getSelectedAddressType();

		if (!bip39Passphrase) {
			bip39Passphrase = await getBip39Passphrase(walletName);
		}

		const wallets = getWalletStore().wallets;
		if (walletName in wallets && wallets[walletName]?.id) {
			return err(`Wallet ID, "${walletName}" already exists.`);
		}
		if (!validateMnemonic(mnemonic)) {
			return err('Invalid Mnemonic');
		}
		await setKeychainValue({ key: walletName, value: mnemonic });
		await setKeychainValue({
			key: `${walletName}passphrase`,
			value: bip39Passphrase,
		});

		const seed = await bip39.mnemonicToSeed(mnemonic, bip39Passphrase);
		const defaultWalletShape = getDefaultWalletShape();

		//Generate a set of addresses & changeAddresses for each network.
		const addressesObj = defaultWalletShape.addresses;
		const changeAddressesObj = defaultWalletShape.changeAddresses;
		const addressIndex = defaultWalletShape.addressIndex;
		const changeAddressIndex = defaultWalletShape.changeAddressIndex;
		const lastUsedAddressIndex = defaultWalletShape.lastUsedAddressIndex;
		const lastUsedChangeAddressIndex =
			defaultWalletShape.lastUsedChangeAddressIndex;

		await setKeychainSlashtagsPrimaryKey(seed);

		for (const { type, path } of Object.values(addressTypes)) {
			const pathObject = getKeyDerivationPathObject({
				path,
				selectedNetwork,
			});
			if (pathObject.isErr()) {
				return err(pathObject.error.message);
			}
			const generatedAddresses = await generateAddresses({
				selectedWallet: walletName,
				selectedNetwork,
				addressAmount,
				changeAddressAmount,
				keyDerivationPath: pathObject.value,
				addressType: type,
			});
			if (generatedAddresses.isErr()) {
				return err(generatedAddresses.error);
			}
			const { addresses, changeAddresses } = generatedAddresses.value;
			const addressZeroIndex = Object.values(addresses).find(
				(a) => a.index === 0,
			);
			const changeAddressZeroIndex = Object.values(changeAddresses).find(
				(a) => a.index === 0,
			);
			if (addressZeroIndex) {
				addressIndex[selectedNetwork][type] = addressZeroIndex;
			}
			if (changeAddressZeroIndex) {
				changeAddressIndex[selectedNetwork][type] = changeAddressZeroIndex;
			}
			addressesObj[selectedNetwork][type] = addresses;
			changeAddressesObj[selectedNetwork][type] = changeAddresses;
		}

		const payload: IWallets = {
			[walletName]: {
				...defaultWalletShape,
				seedHash: seedHash(seed),
				addressType: {
					bitcoin: selectedAddressType,
					bitcoinTestnet: selectedAddressType,
					bitcoinRegtest: selectedAddressType,
				},
				addressIndex,
				changeAddressIndex,
				addresses: addressesObj,
				changeAddresses: changeAddressesObj,
				lastUsedAddressIndex,
				lastUsedChangeAddressIndex,
				id: walletName,
			},
		};
		return ok(payload);
	} catch (e) {
		return err(e);
	}
};

/**
 * large = Sort by and use largest UTXO first. Lowest fee, but reveals your largest UTXO's and reduces privacy.
 * small = Sort by and use smallest UTXO first. Higher fee, but hides your largest UTXO's and increases privacy.
 * consolidate = Use all available UTXO's regardless of the amount being sent. Preferable to use this method when fees are low in order to reduce fees in future transactions.
 */
export interface IAddressIOTypes {
	inputs: {
		[key in EAddressType]: number;
	};
	outputs: {
		[key in EAddressType]: number;
	};
}
/**
 * Returns the transaction fee and outputs along with the inputs that best fit the sort method.
 * @async
 * @param {IAddress[]} inputs
 * @param {IAddress[]} outputs
 * @param {number} [satsPerByte]
 * @param {sortMethod}
 * @return {Promise<number>}
 */
export interface ICoinSelectResponse {
	fee: number;
	inputs: IUtxo[];
	outputs: IOutput[];
}

/**
 * This method will do its best to select only the necessary inputs that are provided base on the selected sortMethod.
 * @param {IUtxo[]} [inputs]
 * @param {IUtxo[]} [outputs]
 * @param {number} [satsPerByte]
 * @param {TCoinSelectPreference} [sortMethod]
 * @param {number} [amountToSend]
 */
export const autoCoinSelect = async ({
	inputs = [],
	outputs = [],
	satsPerByte = 1,
	sortMethod = 'small',
	amountToSend = 0,
}: {
	inputs?: IUtxo[];
	outputs?: IOutput[];
	satsPerByte?: number;
	sortMethod?: TCoinSelectPreference;
	amountToSend?: number;
}): Promise<Result<ICoinSelectResponse>> => {
	try {
		if (!inputs) {
			return err('No inputs provided');
		}
		if (!outputs) {
			return err('No outputs provided');
		}
		if (!amountToSend) {
			//If amountToSend is not specified, attempt to determine how much to send from the output values.
			amountToSend = outputs.reduce((acc, cur) => {
				return acc + Number(cur?.value) || 0;
			}, 0);
		}

		//Sort by the largest UTXO amount (Lowest fee, but reveals your largest UTXO's)
		if (sortMethod === 'large') {
			inputs.sort((a, b) => Number(b.value) - Number(a.value));
		} else {
			//Sort by the smallest UTXO amount (Highest fee, but hides your largest UTXO's)
			inputs.sort((a, b) => Number(a.value) - Number(b.value));
		}

		//Add UTXO's until we have more than the target amount to send.
		let inputAmount = 0;
		let newInputs: IUtxo[] = [];
		let oldInputs: IUtxo[] = [];

		//Consolidate UTXO's if unable to determine the amount to send.
		if (sortMethod === 'consolidate' || !amountToSend) {
			//Add all inputs
			newInputs = [...inputs];
			inputAmount = newInputs.reduce((acc, cur) => {
				return acc + Number(cur.value);
			}, 0);
		} else {
			//Add only the necessary inputs based on the amountToSend.
			await Promise.all(
				inputs.map((input) => {
					if (inputAmount < amountToSend) {
						inputAmount += input.value;
						newInputs.push(input);
					} else {
						oldInputs.push(input);
					}
				}),
			);

			//The provided UTXO's do not have enough to cover the transaction.
			if ((amountToSend && inputAmount < amountToSend) || !newInputs?.length) {
				return err('Not enough funds.');
			}
		}

		// Get all input and output address types for fee calculation.
		const addressTypes = {
			inputs: {},
			outputs: {},
		} as IAddressIOTypes;

		await Promise.all([
			newInputs.map(({ address }) => {
				const validateResponse = getAddressInfo(address);
				if (!validateResponse) {
					return;
				}
				const type = validateResponse.type.toUpperCase();
				if (type in addressTypes.inputs) {
					addressTypes.inputs[type] = addressTypes.inputs[type] + 1;
				} else {
					addressTypes.inputs[type] = 1;
				}
			}),
			outputs.map(({ address }) => {
				if (!address) {
					return;
				}
				const validateResponse = getAddressInfo(address);
				if (!validateResponse) {
					return;
				}
				const type = validateResponse.type.toUpperCase();
				if (type in addressTypes.outputs) {
					addressTypes.outputs[type] = addressTypes.outputs[type] + 1;
				} else {
					addressTypes.outputs[type] = 1;
				}
			}),
		]);

		const baseFee = getByteCount(addressTypes.inputs, addressTypes.outputs);
		const fee = baseFee * satsPerByte;

		//Ensure we can still cover the transaction with the previously selected UTXO's. Add more UTXO's if not.
		const totalTxCost = amountToSend + fee;
		if (amountToSend && inputAmount < totalTxCost) {
			await Promise.all(
				oldInputs.map((input) => {
					if (inputAmount < totalTxCost) {
						inputAmount += input.value;
						newInputs.push(input);
					}
				}),
			);
		}

		//The provided UTXO's do not have enough to cover the transaction.
		if (inputAmount < totalTxCost || !newInputs?.length) {
			return err('Not enough funds');
		}
		return ok({ inputs: newInputs, outputs, fee });
	} catch (e) {
		return err(e);
	}
};

/**
 * Parses a key derivation path object and returns it in string format. Ex: "m/84'/0'/0'/0/0"
 * @param {IKeyDerivationPath} path
 * @param {TKeyDerivationPurpose | string} [purpose]
 * @param {boolean} [changeAddress]
 * @param {TKeyDerivationAccountType} [accountType]
 * @param {string} [addressIndex]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Result<string>}
 */
export const getKeyDerivationPathString = ({
	path,
	purpose,
	accountType,
	changeAddress,
	addressIndex = '0',
	selectedNetwork,
}: {
	path: IKeyDerivationPath;
	purpose?: TKeyDerivationPurpose;
	accountType?: TKeyDerivationAccountType;
	changeAddress?: boolean;
	addressIndex?: string;
	selectedNetwork?: TAvailableNetworks;
}): Result<string> => {
	try {
		if (!path) {
			return err('No path specified.');
		}
		//Specifically specifying purpose will override the default accountType purpose value.
		if (purpose) {
			path.purpose = purpose;
		}

		if (selectedNetwork) {
			path.coinType = selectedNetwork.toLocaleLowerCase().includes('testnet')
				? '1'
				: '0';
		}
		if (accountType) {
			path.account = getKeyDerivationAccount(accountType);
		}
		if (changeAddress !== undefined) {
			path.change = changeAddress ? '1' : '0';
		}
		return ok(
			`m/${path.purpose}'/${path.coinType}'/${path.account}'/${path.change}/${addressIndex}`,
		);
	} catch (e) {
		return err(e);
	}
};

/**
 * Parses a key derivation path in string format Ex: "m/84'/0'/0'/0/0" and returns IKeyDerivationPath.
 * @param {string} keyDerivationPath
 * @param {TKeyDerivationPurpose | string} [purpose]
 * @param {boolean} [changeAddress]
 * @param {TKeyDerivationAccountType} [accountType]
 * @param {string} [addressIndex]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Result<IKeyDerivationPath>}
 */
export const getKeyDerivationPathObject = ({
	path = '',
	purpose,
	accountType,
	changeAddress,
	addressIndex,
	selectedNetwork,
}: {
	path: string;
	purpose?: TKeyDerivationPurpose;
	accountType?: TKeyDerivationAccountType;
	changeAddress?: boolean;
	addressIndex?: string;
	selectedNetwork?: TAvailableNetworks;
}): Result<IKeyDerivationPath> => {
	try {
		const parsedPath = path.replace(/'/g, '').split('/');

		if (!purpose) {
			purpose = parsedPath[1] as TKeyDerivationPurpose;
		}

		let coinType = parsedPath[2] as TKeyDerivationCoinType;
		if (selectedNetwork) {
			coinType = selectedNetwork.toLocaleLowerCase().includes('testnet')
				? '1'
				: '0';
		}

		let account = parsedPath[3] as TKeyDerivationAccount;
		if (accountType) {
			account = getKeyDerivationAccount(accountType);
		}

		let change = parsedPath[4] as TKeyDerivationChange;
		if (changeAddress !== undefined) {
			change = changeAddress ? '1' : '0';
		}

		if (!addressIndex) {
			addressIndex = parsedPath[5];
		}

		return ok({
			purpose,
			coinType,
			account,
			change,
			addressIndex,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns available address types for the given network and wallet
 * @return IAddressTypes
 */
export const getAddressTypes = (): IAddressTypes => {
	return getWalletStore().addressTypes;
};

/**
 * The method returns the base key derivation path for a given address type.
 * @param {EAddressType} [addressType]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @param {boolean} [changeAddress]
 * @return {Result<{ pathString: string, pathObject: IKeyDerivationPath }>}
 */
export const getAddressTypePath = ({
	addressType,
	selectedNetwork,
	selectedWallet,
	changeAddress,
}: {
	addressType?: EAddressType;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	changeAddress?: boolean;
}): Result<IKeyDerivationPathData> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!addressType) {
			addressType = getSelectedAddressType({ selectedNetwork, selectedWallet });
		}
		const addressTypes = getAddressTypes();

		const path = addressTypes[addressType].path;
		const pathData = formatKeyDerivationPath({
			path,
			selectedNetwork,
			changeAddress,
		});
		if (pathData.isErr()) {
			return err(pathData.error.message);
		}

		return ok({
			pathString: pathData.value.pathString,
			pathObject: pathData.value.pathObject,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the next available receive address for the given network and wallet.
 * @param {EAddressType} [addressType]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @return {Result<string>}
 */
export const getReceiveAddress = async ({
	addressType,
	selectedNetwork,
	selectedWallet,
}: {
	addressType?: EAddressType;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!addressType) {
			addressType = getSelectedAddressType({ selectedNetwork, selectedWallet });
		}
		const wallet = getWalletStore().wallets[selectedWallet];
		const addressIndex = wallet.addressIndex[selectedNetwork];
		const receiveAddress = addressIndex[addressType].address;
		if (receiveAddress) {
			return ok(receiveAddress);
		}
		const addresses = wallet?.addresses[selectedNetwork][addressType];

		// Check if addresses were generated, but the index has not been set yet.
		if (
			Object.keys(addresses).length > 0 &&
			addressIndex[addressType].index < 0
		) {
			// Grab and return the address at index 0.
			const address = Object.values(addresses).find(({ index }) => index === 0);
			if (address) {
				return ok(address.address);
			}
		}
		// Fallback to generating a new receive address on the fly.
		const generatedAddress = await generateNewReceiveAddress({
			selectedWallet,
			selectedNetwork,
			addressType,
		});
		if (generatedAddress.isOk()) {
			return ok(generatedAddress.value.address);
		} else {
			console.log(generatedAddress.error.message);
		}
		return err('No receive address available.');
	} catch (e) {
		return err(e);
	}
};

interface IGetBalanceProps extends IncludeBalances {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}
/**
 * Retrieves the total wallet display values for the currently selected wallet and network.
 * @param {boolean} [onchain]
 * @param {boolean} [lightning]
 * @param {boolean} [subtractReserveBalance]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const getBalance = ({
	onchain = false,
	lightning = false,
	subtractReserveBalance = true,
	selectedWallet,
	selectedNetwork,
}: IGetBalanceProps): IDisplayValues => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	let balance = 0;

	const { currentWallet, currentLightningNode } = getCurrentWallet({
		selectedWallet,
		selectedNetwork,
	});

	if (onchain) {
		balance += currentWallet?.balance[selectedNetwork] ?? 0;
	}

	if (lightning) {
		const openChannelIds =
			currentLightningNode?.openChannelIds[selectedNetwork];
		const channels = currentLightningNode?.channels[selectedNetwork];
		const openChannels = Object.values(channels).filter((channel) => {
			return openChannelIds.includes(channel.channel_id);
		});

		balance = Object.values(openChannels).reduce(
			(previousValue, currentChannel) => {
				if (currentChannel.is_channel_ready) {
					let reserveBalance = 0;
					if (subtractReserveBalance) {
						reserveBalance = currentChannel.unspendable_punishment_reserve ?? 0;
					}
					return previousValue + currentChannel.balance_sat - reserveBalance;
				}
				return previousValue;
			},
			balance,
		);
	}

	return getDisplayValues({ satoshis: balance });
};

/**
 * Returns the difference between the current address index and the last used address index.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {EAddressType} [addressType]
 * @returns {Result<{ addressDelta: number; changeAddressDelta: number }>}
 */
export const getGapLimit = ({
	selectedWallet,
	selectedNetwork,
	addressType,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	addressType?: EAddressType;
}): Result<{ addressDelta: number; changeAddressDelta: number }> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!addressType) {
			addressType = getSelectedAddressType({ selectedNetwork, selectedWallet });
		}
		const { currentWallet } = getCurrentWallet({
			selectedWallet,
			selectedNetwork,
		});
		const addressIndex =
			currentWallet.addressIndex[selectedNetwork][addressType].index;
		const lastUsedAddressIndex =
			currentWallet.lastUsedAddressIndex[selectedNetwork][addressType].index;
		const changeAddressIndex =
			currentWallet.changeAddressIndex[selectedNetwork][addressType].index;
		const lastUsedChangeAddressIndex =
			currentWallet.lastUsedChangeAddressIndex[selectedNetwork][addressType]
				.index;
		const addressDelta = Math.abs(
			addressIndex - (lastUsedAddressIndex > 0 ? lastUsedAddressIndex : 0),
		);
		const changeAddressDelta = Math.abs(
			changeAddressIndex -
				(lastUsedChangeAddressIndex > 0 ? lastUsedChangeAddressIndex : 0),
		);

		return ok({ addressDelta, changeAddressDelta });
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Get address for a given scriptPubKey.
 * @param scriptPubKey
 * @param selectedNetwork
 * @returns {string}
 */
export const getAddressFromScriptPubKey = (
	scriptPubKey: string,
	selectedNetwork?: TAvailableNetworks,
): string => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const network = networks[selectedNetwork];
	return bitcoin.address.fromOutputScript(
		Buffer.from(scriptPubKey, 'hex'),
		network,
	);
};

/**
 * Returns current address index information.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {EAddressType} [addressType]
 */
export const getAddressIndexInfo = ({
	selectedWallet,
	selectedNetwork,
	addressType,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	addressType?: EAddressType;
}): TAddressIndexInfo => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!addressType) {
		addressType = getSelectedAddressType({ selectedNetwork, selectedWallet });
	}
	const { currentWallet } = getCurrentWallet({
		selectedWallet,
		selectedNetwork,
	});
	const addressIndex = currentWallet.addressIndex[selectedNetwork][addressType];
	const changeAddressIndex =
		currentWallet.addressIndex[selectedNetwork][addressType];
	const lastUsedAddressIndex =
		currentWallet.lastUsedAddressIndex[selectedNetwork][addressType];
	const lastUsedChangeAddressIndex =
		currentWallet.lastUsedChangeAddressIndex[selectedNetwork][addressType];
	return {
		addressIndex,
		changeAddressIndex,
		lastUsedAddressIndex,
		lastUsedChangeAddressIndex,
	};
};

/**
 * This method will clear the utxo array for each address type and reset the
 * address indexes back to the original/default app values. Once cleared & reset
 * the app will rescan the wallet's addresses from index zero.
 * @param selectedWallet
 * @param selectedNetwork
 */
export const rescanAddresses = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	await clearUtxos({ selectedWallet, selectedNetwork }).then();
	await resetAddressIndexes({ selectedWallet, selectedNetwork });
	// Wait to generate our zero index addresses.
	await createZeroIndexAddresses({ selectedWallet, selectedNetwork });
	return await refreshWallet({
		onchain: true,
		lightning: false,
		scanAllAddresses: true,
		selectedWallet,
		selectedNetwork,
		updateAllAddressTypes: true,
	});
};

/**
 * Creates and sets zero address indexes for each address type.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<void>}
 */
export const createZeroIndexAddresses = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<void> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const addressTypes = getAddressTypes();
	await Promise.all(
		Object.values(addressTypes).map(async ({ type }) => {
			await addAddresses({
				selectedWallet,
				selectedNetwork,
				addressAmount: 1,
				changeAddressAmount: 1,
				addressIndex: 0,
				changeAddressIndex: 0,
				addressType: type,
			});
		}),
	);
};
