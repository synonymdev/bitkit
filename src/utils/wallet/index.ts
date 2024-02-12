import { InteractionManager } from 'react-native';
import { getAddressInfo } from 'bitcoin-address-validation';
import { constants } from '@synonymdev/slashtags-sdk';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';
import { err, ok, Result } from '@synonymdev/result';

import { EAvailableNetwork, networks } from '../networks';
import {
	addressTypes,
	getDefaultWalletShape,
	getDefaultWalletStoreShape,
	TAddressIndexInfo,
} from '../../store/shapes/wallet';
import {
	EPaymentType,
	IAddress,
	IAddresses,
	IFormattedTransactions,
	IKeyDerivationPath,
	IKeyDerivationPathData,
	IOutput,
	IUtxo,
	IWallet,
	IWallets,
	TKeyDerivationAccount,
	TKeyDerivationAccountType,
	TKeyDerivationChange,
	TKeyDerivationCoinType,
	TKeyDerivationPurpose,
	TWalletName,
} from '../../store/types/wallet';
import {
	IGetAddress,
	IGenerateAddresses,
	IGetAddressResponse,
	IGetInfoFromAddressPath,
} from '../types';
import i18n from '../i18n';
import { btcToSats } from '../conversion';
import { getKeychainValue, setKeychainValue } from '../keychain';
import {
	dispatch,
	getLightningStore,
	getSettingsStore,
	getStore,
	getWalletStore,
} from '../../store/helpers';
import {
	createDefaultWalletStructure,
	generateNewReceiveAddress,
	getWalletData,
	setWalletData,
	updateExchangeRates,
	updateWallet,
} from '../../store/actions/wallet';
import { TCoinSelectPreference } from '../../store/types/settings';
import { updateActivityList } from '../../store/utils/activity';
import {
	getBlockHeader,
	getTransactionsFromInputs,
	TTxResult,
} from './electrum';
import { invokeNodeJsMethod } from '../nodejs-mobile';
import { DefaultNodeJsMethodsShape } from '../nodejs-mobile/shapes';
import { refreshLdk } from '../lightning';
import { BITKIT_WALLET_SEED_HASH_PREFIX, CHUNK_LIMIT } from './constants';
import { moveMetaIncTxTags } from '../../store/utils/metadata';
import { refreshOrdersList } from '../../store/utils/blocktank';
import { TNode } from '../../store/types/lightning';
import { showNewOnchainTxPrompt, showNewTxPrompt } from '../../store/utils/ui';
import { promiseTimeout, reduceValue } from '../helpers';
import { objectKeys } from '../objectKeys';
import {
	EAddressType,
	EAvailableNetworks,
	EElectrumNetworks,
	Electrum,
	getByteCount,
	ICustomGetAddress,
	IFormattedTransaction,
	IGenerateAddressesResponse,
	IRbfData,
	ISendTransaction,
	IWalletData,
	TOnMessage,
	Transaction,
	TTransactionMessage,
	Wallet,
} from 'beignet';
import { TServer } from 'beignet/src/types/electrum';
import { showToast } from '../notifications';
import { updateUi } from '../../store/slices/ui';
import { ICustomGetScriptHash } from 'beignet/src/types/wallet';
import { ldk } from '@synonymdev/react-native-ldk';
import { resetActivityState } from '../../store/slices/activity';

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

let wallet: Wallet;

export const refreshWallet = async ({
	onchain = true,
	lightning = true,
	scanAllAddresses = false, // If set to false, on-chain scanning will adhere to the gap limit (20).
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
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<string>> => {
	try {
		// wait for interactions/animations to be completed
		await new Promise((resolve) => {
			InteractionManager.runAfterInteractions(() => resolve(null));
		});
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}

		let notificationTxid: string | undefined;

		if (onchain) {
			await wallet.refreshWallet({ scanAllAddresses });
		}

		if (lightning) {
			await refreshLdk({ selectedWallet, selectedNetwork });
			await refreshOrdersList();
		}

		if (onchain || lightning) {
			updateActivityList();
			moveMetaIncTxTags();
		}

		if (showNotification && notificationTxid) {
			showNewTxPrompt(notificationTxid);
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
 * @param {string} [keyDerivationPath] - The path to generate addresses from.
 * @param {string} [addressType] - Determines what type of address to generate (p2pkh, p2sh, p2wpkh).
 */
export const generateAddresses = async ({
	addressAmount = 10,
	changeAddressAmount = 10,
	addressIndex = 0,
	changeAddressIndex = 0,
	keyDerivationPath,
	addressType,
}: IGenerateAddresses): Promise<Result<IGenerateAddressesResponse>> => {
	try {
		return await wallet.generateAddresses({
			addressAmount,
			changeAddressAmount,
			addressIndex,
			changeAddressIndex,
			keyDerivationPath,
			addressType,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns private key for the provided address data.
 * @param {IAddress} addressData
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {Promise<Result<string>>}
 */
export const getPrivateKey = async ({
	addressData,
	selectedNetwork,
}: {
	addressData: IAddress;
	selectedNetwork?: EAvailableNetwork;
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
 * @param {EAvailableNetwork} [selectedNetwork]
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
	selectedNetwork?: EAvailableNetwork;
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
 * Returns the derivation path object for the specified addressType and network.
 * @param {EAddressType} addressType
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns Result<IKeyDerivationPath>
 */
export const getKeyDerivationPath = ({
	addressType,
	selectedNetwork,
}: {
	addressType: EAddressType;
	selectedNetwork?: EAvailableNetwork;
}): Result<IKeyDerivationPath> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const keyDerivationPathResponse = getKeyDerivationPathObject({
			selectedNetwork,
			path: addressTypes[addressType].path,
		});
		if (keyDerivationPathResponse.isErr()) {
			return err(keyDerivationPathResponse.error.message);
		}
		return ok(keyDerivationPathResponse.value);
	} catch (e) {
		return err(e);
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
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {string}
 */
export const getScriptHash = async (
	address: string,
	selectedNetwork?: EAvailableNetwork,
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
 * Get scriptHash for a given address
 * @param {string} address
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {string}
 */
export const getCustomScriptHash = async ({
	address,
	selectedNetwork,
}: ICustomGetScriptHash): Promise<string> => {
	try {
		if (!address) {
			return '';
		}
		const data = DefaultNodeJsMethodsShape.getScriptHash();
		data.data.address = address;
		data.data.selectedNetwork = electrumNetworkToBitkitNetwork(selectedNetwork);
		const getScriptHashResponse = await invokeNodeJsMethod<string>(data);
		if (getScriptHashResponse.error) {
			return '';
		}
		return getScriptHashResponse.value;
	} catch {
		return '';
	}
};

export const electrumNetworkToBitkitNetwork = (
	network: EElectrumNetworks,
): EAvailableNetwork => {
	switch (network) {
		case EElectrumNetworks.bitcoin:
			return EAvailableNetwork.bitcoin;
		case EElectrumNetworks.bitcoinRegtest:
			return EAvailableNetwork.bitcoinRegtest;
		case EElectrumNetworks.bitcoinTestnet:
			return EAvailableNetwork.bitcoinTestnet;
	}
};

/**
 * Get address for a given keyPair, network and type.
 * @param {string} path
 * @param {EAvailableNetwork} [selectedNetwork]
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
 * Get address for a given keyPair, network and type.
 * @param {string} path
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {EAddressType} type - Determines what type of address to generate (p2pkh, p2sh, p2wpkh).
 * @return {string}
 */
export const customGetAddress = async ({
	path,
	selectedNetwork,
	type,
}: ICustomGetAddress): Promise<Result<IGetAddressResponse>> => {
	if (!path) {
		return err('No path specified');
	}
	try {
		const data = DefaultNodeJsMethodsShape.getAddress();
		data.data.path = path;
		data.data.type = type;
		data.data.selectedNetwork = electrumNetworkToBitkitNetwork(selectedNetwork);
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
	selectedNetwork?: EAvailableNetwork;
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
	selectedNetwork?: EAvailableNetwork;
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
	addressType,
}: {
	addressType: EAddressType;
}): Result<{
	addressIndex: IAddress;
	changeAddressIndex: IAddress;
}> => {
	try {
		const currentWallet = getOnChainWalletData();
		const addresses = currentWallet.addresses[addressType];
		const changeAddresses = currentWallet.changeAddresses[addressType];

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
 * Returns the currently selected network.
 * @return {EAvailableNetwork}
 */
export const getSelectedNetwork = (): EAvailableNetwork => {
	return getWalletStore()?.selectedNetwork ?? 'bitcoin';
};

/**
 * Returns the currently selected address type (p2pkh | p2sh | p2wpkh | p2tr).
 * @returns {EAddressType}
 */
export const getSelectedAddressType = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): EAddressType => {
	const storedWallet = getWalletStore().wallets[selectedWallet];
	if (storedWallet?.addressType[selectedNetwork]) {
		return storedWallet.addressType[selectedNetwork];
	} else {
		return getDefaultWalletShape().addressType[selectedNetwork];
	}
};

/**
 * Returns the currently monitored address types (p2pkh | p2sh | p2wpkh | p2tr).
 * @returns {EAddressType[]}
 */
export const getAddressTypesToMonitor = (): EAddressType[] => {
	return getWalletStore().addressTypesToMonitor;
};

/**
 * Returns the currently selected wallet (Ex: 'wallet0').
 * @return {TWalletName}
 */
export const getSelectedWallet = (): TWalletName => {
	return getWalletStore()?.selectedWallet ?? 'wallet0';
};

/**
 * Returns all state data for the currently selected wallet.
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @return {{ currentWallet: IWallet, currentLightningNode: TNode, selectedWallet: TWalletName, selectedNetwork: EAvailableNetwork }}
 */
export const getCurrentWallet = ({
	selectedNetwork = getSelectedNetwork(),
	selectedWallet = getSelectedWallet(),
}: {
	selectedNetwork?: EAvailableNetwork;
	selectedWallet?: TWalletName;
} = {}): {
	currentWallet: IWallet;
	currentLightningNode: TNode;
	selectedNetwork: EAvailableNetwork;
	selectedWallet: TWalletName;
} => {
	const walletStore = getWalletStore();
	const lightning = getLightningStore();
	const currentLightningNode = lightning.nodes[selectedWallet];
	const currentWallet = walletStore.wallets[selectedWallet];
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
	selectedNetwork: EAvailableNetwork;
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
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {Result<IFormattedTransaction>}
 */
export const getTransactionById = ({
	txid,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
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
		blocktime?: number;
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
	selectedNetwork?: EAvailableNetwork;
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
	selectedNetwork?: EAvailableNetwork;
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
	const addressTypeKeys = objectKeys(EAddressType);
	const inputData = inputDataResponse.value;
	const currentAddresses = currentWallet.addresses[selectedNetwork];
	const currentChangeAddresses = currentWallet.changeAddresses[selectedNetwork];

	let addresses = {} as IAddresses;
	let changeAddresses = {} as IAddresses;

	addressTypeKeys.map((addressType) => {
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
		const vsize = result.vsize;
		const satsPerByte = btcToSats(fee) / vsize;
		const { address, height, scriptHash } = data;
		let timestamp = Date.now();
		let confirmTimestamp: number | undefined;

		if (height > 0 && result.blocktime) {
			confirmTimestamp = result.blocktime * 1000;
			//In the event we're recovering, set the older timestamp.
			if (confirmTimestamp < timestamp) {
				timestamp = confirmTimestamp;
			}
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
			confirmTimestamp,
			vsize,
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
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedNetwork?: EAvailableNetwork;
}): TServer[] => {
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

/**
 * Using a tx_hash this method will return the necessary data to create a
 * replace-by-fee transaction for any 0-conf, RBF-enabled tx.
 * @param txHash
 */
export const getRbfData = async ({
	txHash,
}: {
	txHash: ITxHash;
}): Promise<Result<IRbfData>> => {
	return await wallet.getRbfData({ txHash });
};

/**
 * Converts IRbfData to ISendTransaction.
 * CURRENTLY NOT USED
 * @param {IRbfData} data
 */
// export const formatRbfData = async (
// 	data: IRbfData,
// ): Promise<Partial<ISendTransaction>> => {
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
 * @param {string} [mnemonic]
 * @param {string} [bip39Passphrase]
 * @param {EAddressType} [addressTypesToCreate]
 * @return {Promise<Result<IWallets>>}
 */
export const createDefaultWallet = async ({
	walletName,
	mnemonic,
	bip39Passphrase,
	restore,
	addressTypesToCreate = getDefaultWalletStoreShape().addressTypesToMonitor,
	selectedNetwork = getSelectedNetwork(),
	servers,
}: {
	walletName: TWalletName;
	mnemonic: string;
	bip39Passphrase: string;
	restore: boolean;
	addressTypesToCreate?: EAddressType[];
	selectedNetwork?: EAvailableNetwork;
	servers?: TServer | TServer[];
}): Promise<Result<IWallets>> => {
	try {
		const selectedAddressType = getSelectedAddressType();

		if (!bip39Passphrase) {
			bip39Passphrase = await getBip39Passphrase(walletName);
		}

		const wallets = getWalletStore().wallets;
		if (walletName in wallets && wallets[walletName]?.id) {
			return err(`Wallet "${walletName}" already exists.`);
		}
		if (!validateMnemonic(mnemonic)) {
			if (restore) {
				return err(i18n.t('wallet:create_wallet_mnemonic_restore_error'));
			} else {
				return err(i18n.t('wallet:create_wallet_mnemonic_error'));
			}
		}
		await setKeychainValue({ key: walletName, value: mnemonic });
		await setKeychainValue({
			key: `${walletName}passphrase`,
			value: bip39Passphrase,
		});

		const seed = await bip39.mnemonicToSeed(mnemonic, bip39Passphrase);
		await setKeychainSlashtagsPrimaryKey(seed);

		await createDefaultWalletStructure({ walletName });

		const defaultWalletShape = getDefaultWalletShape();
		const setupWalletRes = await setupOnChainWallet({
			name: walletName,
			selectedNetwork,
			bip39Passphrase: bip39Passphrase,
			addressType: selectedAddressType,
			servers,
			disableMessagesOnCreate: true,
			addressTypesToMonitor: addressTypesToCreate,
		});
		if (setupWalletRes.isErr()) {
			return err(setupWalletRes.error.message);
		}
		const walletData = setupWalletRes.value.data;

		const payload: IWallets = {
			[walletName]: {
				...defaultWalletShape,
				seedHash: seedHash(seed),
				addressType: {
					bitcoin: selectedAddressType,
					bitcoinTestnet: selectedAddressType,
					bitcoinRegtest: selectedAddressType,
				},
				addressIndex: {
					...defaultWalletShape.addressIndex,
					[selectedNetwork]: {
						...defaultWalletShape.addressIndex[selectedNetwork],
						...walletData.addressIndex,
					},
				},
				changeAddressIndex: {
					...defaultWalletShape.changeAddressIndex,
					[selectedNetwork]: {
						...defaultWalletShape.changeAddressIndex[selectedNetwork],
						...walletData.changeAddressIndex,
					},
				},
				addresses: {
					...defaultWalletShape.addresses,
					[selectedNetwork]: {
						...defaultWalletShape.addresses[selectedNetwork],
						...walletData.addresses,
					},
				},
				changeAddresses: {
					...defaultWalletShape.changeAddresses,
					[selectedNetwork]: {
						...defaultWalletShape.changeAddresses[selectedNetwork],
						...walletData.changeAddresses,
					},
				},
				lastUsedAddressIndex: {
					...defaultWalletShape.lastUsedAddressIndex,
					[selectedNetwork]: {
						...defaultWalletShape.lastUsedAddressIndex[selectedNetwork],
						...walletData.lastUsedAddressIndex,
					},
				},
				lastUsedChangeAddressIndex: {
					...defaultWalletShape.lastUsedChangeAddressIndex,
					[selectedNetwork]: {
						...defaultWalletShape.lastUsedChangeAddressIndex[selectedNetwork],
						...walletData.lastUsedChangeAddressIndex,
					},
				},
				transaction: {
					...defaultWalletShape.transaction,
					[selectedNetwork]: walletData.transaction,
				},
				transactions: {
					...defaultWalletShape.transactions,
					[selectedNetwork]: walletData.transactions,
				},
				unconfirmedTransactions: {
					...defaultWalletShape.unconfirmedTransactions,
					[selectedNetwork]: walletData.unconfirmedTransactions,
				},
				utxos: {
					...defaultWalletShape.utxos,
					[selectedNetwork]: walletData.utxos,
				},
				id: walletData.id,
			},
		};
		return ok(payload);
	} catch (e) {
		return err(e);
	}
};

const onElectrumConnectionChange = (isConnected: boolean): void => {
	// get state fresh from store everytime
	const { isConnectedToElectrum } = getStore().ui;

	if (!isConnectedToElectrum && isConnected) {
		dispatch(updateUi({ isConnectedToElectrum: isConnected }));
		showToast({
			type: 'success',
			title: i18n.t('other:connection_restored_title'),
			description: i18n.t('other:connection_restored_message'),
		});
	}

	if (isConnectedToElectrum && !isConnected) {
		dispatch(updateUi({ isConnectedToElectrum: isConnected }));
		showToast({
			type: 'error',
			title: i18n.t('other:connection_reconnect_title'),
			description: i18n.t('other:connection_reconnect_msg'),
		});
	}
};

const onMessage: TOnMessage = (key, data) => {
	switch (key) {
		case 'transactionReceived':
			if (
				wallet?.isSwitchingNetworks !== undefined &&
				!wallet?.isSwitchingNetworks
			) {
				const txMsg: TTransactionMessage = data as TTransactionMessage;
				const txId = txMsg.transaction.txid;
				const { currentWallet, selectedNetwork } = getCurrentWallet();

				const transfer = currentWallet.transfers[selectedNetwork].find((t) => {
					return t.txId === txId;
				});
				const isTransferToSavings = transfer?.type === 'coop-close' ?? false;

				if (!isTransferToSavings) {
					showNewOnchainTxPrompt({
						id: txId,
						value: btcToSats(txMsg.transaction.value),
					});
				}
			}
			setTimeout(() => {
				updateActivityList();
			}, 500);
			break;
		case 'transactionSent':
			setTimeout(() => {
				updateActivityList();
			}, 500);
			break;
		case 'connectedToElectrum':
			onElectrumConnectionChange(data as boolean);
			break;
		case 'reorg':
			const utxoArr = data as IUtxo[];
			// Notify user that a reorg has occurred and that the transaction has been pushed back into the mempool.
			showToast({
				type: 'info',
				title: i18n.t('wallet:reorg_detected'),
				description: i18n.t('wallet:reorg_msg_begin', {
					count: utxoArr.length,
				}),
				autoHide: false,
			});
			break;
		case 'rbf':
			const rbfData = data as string[];
			showToast({
				type: 'error',
				title: i18n.t('wallet:activity_removed_title'),
				description: i18n.t('wallet:activity_removed_msg', {
					count: rbfData.length,
				}),
				autoHide: false,
			});
			break;
		case 'newBlock':
			refreshWallet({}).then();
	}
};

export const setupOnChainWallet = async ({
	name = getSelectedWallet(),
	mnemonic,
	bip39Passphrase,
	selectedNetwork = getSelectedNetwork(),
	addressType = getSelectedAddressType(),
	setStorage = true,
	servers,
	disableMessagesOnCreate = false,
	addressTypesToMonitor = [addressType],
}: {
	name: TWalletName;
	mnemonic?: string;
	bip39Passphrase?: string;
	selectedNetwork?: EAvailableNetwork;
	addressType?: EAddressType;
	setStorage?: boolean;
	servers?: TServer | TServer[];
	disableMessagesOnCreate?: boolean;
	addressTypesToMonitor?: EAddressType[];
}): Promise<Result<Wallet>> => {
	if (!mnemonic) {
		const mnemonicRes = await getMnemonicPhrase(name);
		if (mnemonicRes.isErr()) {
			return err(mnemonicRes.error.message);
		}
		mnemonic = mnemonicRes.value;
	}
	// Fetch any stored custom peers.
	const customPeers = servers ?? getCustomElectrumPeers({ selectedNetwork });
	let storage;
	if (setStorage) {
		storage = {
			getData: getWalletData,
			setData: setWalletData,
		};
	}
	updateExchangeRates();
	const createWalletResponse = await Wallet.create({
		name,
		mnemonic,
		onMessage,
		passphrase: bip39Passphrase,
		network: EAvailableNetworks[selectedNetwork],
		electrumOptions: {
			servers: customPeers,
			tls: global.tls,
			net: global.net,
		},
		storage,
		addressType,
		customGetAddress: customGetAddress,
		customGetScriptHash: getCustomScriptHash,
		disableMessagesOnCreate,
		addressTypesToMonitor,
	});
	if (createWalletResponse.isErr()) {
		return err(createWalletResponse.error.message);
	}
	wallet = createWalletResponse.value;
	return ok(wallet);
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
		const addressIOTypes = {
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
				if (type in addressIOTypes.inputs) {
					addressIOTypes.inputs[type] = addressIOTypes.inputs[type] + 1;
				} else {
					addressIOTypes.inputs[type] = 1;
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
				if (type in addressIOTypes.outputs) {
					addressIOTypes.outputs[type] = addressIOTypes.outputs[type] + 1;
				} else {
					addressIOTypes.outputs[type] = 1;
				}
			}),
		]);

		const baseFee = getByteCount(addressIOTypes.inputs, addressIOTypes.outputs);
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
 * @param {EAvailableNetwork} [selectedNetwork]
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
	selectedNetwork?: EAvailableNetwork;
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
			path.coinType =
				selectedNetwork.toLocaleLowerCase() === EAvailableNetworks.bitcoin
					? '0'
					: '1';
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
 * @param {EAvailableNetwork} [selectedNetwork]
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
	selectedNetwork?: EAvailableNetwork;
}): Result<IKeyDerivationPath> => {
	try {
		const parsedPath = path.replace(/'/g, '').split('/');

		if (!purpose) {
			purpose = parsedPath[1] as TKeyDerivationPurpose;
		}

		let coinType = parsedPath[2] as TKeyDerivationCoinType;
		if (selectedNetwork) {
			coinType =
				selectedNetwork.toLocaleLowerCase() === EAvailableNetworks.bitcoin
					? '0'
					: '1';
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
 * The method returns the base key derivation path for a given address type.
 * @param {EAddressType} [addressType]
 * @param {EAvailableNetwork} [selectedNetwork]
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
	selectedNetwork?: EAvailableNetwork;
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
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {Result<string>}
 */
export const getReceiveAddress = async ({
	addressType,
	selectedNetwork = getSelectedNetwork(),
}: {
	addressType?: EAddressType;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	try {
		if (!addressType) {
			addressType = getSelectedAddressType({ selectedNetwork });
		}
		return wallet.getReceiveAddress({ addressType });
	} catch (e) {
		return err(e);
	}
};
/**
 * Returns the current addressIndex value and will create one if none existed.
 * @param {EAddressType} [addressType]
 * @return {Result<string>}
 */
export const getCurrentAddressIndex = async ({
	addressType,
}: {
	addressType?: EAddressType;
}): Promise<Result<IAddress>> => {
	try {
		addressType = addressType ?? wallet.addressType;
		const currentWallet = wallet.data;
		const addressIndex = currentWallet.addressIndex[addressType];
		const receiveAddress = currentWallet.addressIndex[addressType];
		if (receiveAddress) {
			return ok(receiveAddress);
		}
		const addresses = currentWallet?.addresses[addressType];

		// Check if addresses were generated, but the index has not been set yet.
		if (
			Object.keys(addresses).length > 0 &&
			addressIndex[addressType].index < 0
		) {
			// Grab and return the address at index 0.
			const address = Object.values(addresses).find(({ index }) => index === 0);
			if (address) {
				return ok(address);
			}
		}
		// Fallback to generating a new receive address on the fly.
		const generatedAddress = await generateNewReceiveAddress({
			addressType,
		});
		if (generatedAddress.isOk()) {
			return ok(generatedAddress.value);
		} else {
			console.log(generatedAddress.error.message);
		}
		return err('No address index available.');
	} catch (e) {
		return err(e);
	}
};

/**
 * Retrieves wallet balances for the currently selected wallet and network.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getBalance = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): {
	onchainBalance: number; // Total onchain funds
	lightningBalance: number; // Total lightning funds (spendable + reserved + claimable)
	spendingBalance: number; // Share of lightning funds that are spendable
	reserveBalance: number; // Share of lightning funds that are locked up in channels
	claimableBalance: number; // Funds that will be available after a channel opens/closes
	spendableBalance: number; // Total spendable funds (onchain + spendable lightning)
	totalBalance: number; // Total funds (all of the above)
} => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const { currentWallet, currentLightningNode: node } = getCurrentWallet({
		selectedWallet,
		selectedNetwork,
	});
	const channels = node?.channels[selectedNetwork];
	const openChannelIds = node?.openChannelIds[selectedNetwork];
	const claimableBalances = node?.claimableBalances[selectedNetwork];
	const openChannels = Object.values(channels).filter((channel) => {
		return openChannelIds.includes(channel.channel_id);
	});

	// Get the total spending & reserved balance of all open channels
	let spendingBalance = 0;
	let reserveBalance = 0;
	openChannels.forEach((channel) => {
		if (channel.is_channel_ready) {
			const spendable = channel.outbound_capacity_sat;
			const unspendable = channel.balance_sat - spendable;
			reserveBalance += unspendable;
			spendingBalance += spendable;
		}
	});

	// TODO: filter out some types of claimable balances
	const result = reduceValue(claimableBalances, 'amount_satoshis');
	const claimableBalance = result.isOk() ? result.value : 0;

	const onchainBalance = currentWallet.balance[selectedNetwork];
	const lightningBalance = spendingBalance + reserveBalance + claimableBalance;
	const spendableBalance = onchainBalance + spendingBalance;
	const totalBalance =
		onchainBalance + spendingBalance + reserveBalance + claimableBalance;

	return {
		onchainBalance,
		lightningBalance,
		spendingBalance,
		reserveBalance,
		claimableBalance,
		spendableBalance,
		totalBalance,
	};
};

/**
 * Returns the difference between the current address index and the last used address index.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {EAddressType} [addressType]
 * @returns {Result<{ addressDelta: number; changeAddressDelta: number }>}
 */
export const getGapLimit = ({
	selectedWallet,
	selectedNetwork,
	addressType,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
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
	selectedNetwork?: EAvailableNetwork,
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
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {EAddressType} [addressType]
 */
export const getAddressIndexInfo = ({
	selectedWallet,
	selectedNetwork,
	addressType,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
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
 * @param {boolean} [shouldClearAddresses] - Clears and re-generates all addresses when true.
 * @param {boolean} [shouldClearTransactions]
 * @returns {Promise<Result<string>>}
 */
export const rescanAddresses = async ({
	shouldClearAddresses = true,
	shouldClearTransactions = false,
}: {
	shouldClearAddresses?: boolean;
	shouldClearTransactions?: boolean;
}): Promise<Result<IWalletData>> => {
	return wallet.rescanAddresses({
		shouldClearAddresses,
		shouldClearTransactions,
	});
};

/**
 * Returns the current wallet's unconfirmed transactions.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<IFormattedTransactions>>}
 */
export const getUnconfirmedTransactions = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<IFormattedTransactions>> => {
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

	return ok(currentWallet?.unconfirmedTransactions[selectedNetwork] ?? {});
};

/**
 * Returns the number of confirmations for a given block height.
 * @param {number} height
 * @param {number} [currentHeight]
 * @returns {number}
 */
export const blockHeightToConfirmations = ({
	blockHeight,
	currentHeight,
}: {
	blockHeight?: number;
	currentHeight?: number;
}): number => {
	if (!blockHeight) {
		return 0;
	}
	if (!currentHeight) {
		const header = getBlockHeader();
		currentHeight = header.height;
	}
	if (currentHeight < blockHeight) {
		return 0;
	}
	return currentHeight - blockHeight + 1;
};

/**
 * Returns the block height for a given number of confirmations.
 * @param {number} confirmations
 * @param {number} [currentHeight]
 * @returns {number}
 */
export const confirmationsToBlockHeight = ({
	confirmations,
	currentHeight,
}: {
	confirmations: number;
	currentHeight?: number;
}): number => {
	if (!currentHeight) {
		const header = getBlockHeader();
		currentHeight = header.height;
	}
	if (confirmations > currentHeight) {
		return 0;
	}
	return currentHeight - confirmations;
};

export const getOnChainWallet = (): Wallet => {
	return wallet;
};

export const getOnChainWalletTransaction = (): Transaction => {
	return wallet.transaction;
};

export const getOnChainWalletElectrum = (): Electrum => {
	return wallet?.electrum;
};

export const getOnChainWalletTransactionData = (): ISendTransaction => {
	return wallet.transaction.data;
};

export const getOnChainWalletData = (): IWalletData => {
	return wallet?.data;
};

export const switchNetwork = async (
	selectedNetwork: EAvailableNetwork,
	servers?: TServer | TServer[],
): Promise<Result<boolean>> => {
	const originalNetwork = getSelectedNetwork();
	if (!servers) {
		servers = getCustomElectrumPeers({ selectedNetwork });
	}
	await promiseTimeout(2000, ldk.stop());
	// Wipe existing activity
	dispatch(resetActivityState());
	// Switch to new network.
	updateWallet({ selectedNetwork });
	const response = await wallet.switchNetwork(
		EAvailableNetworks[selectedNetwork],
		servers,
	);
	if (response.isErr()) {
		updateWallet({ selectedNetwork: originalNetwork });
		return err(response.error.message);
	}
	setTimeout(updateActivityList, 500);
	return ok(true);
};
