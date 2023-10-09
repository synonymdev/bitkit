import {
	EAddressType,
	IAddress,
	IAddressTypeData,
	IKeyDerivationPath,
	TWalletName,
} from '../../store/types/wallet';
import { TAvailableNetworks } from '../networks';
import { err, ok, Result } from '@synonymdev/result';
import { getMinMaxObjects, TGetMinMaxObject } from '../helpers';
import isEqual from 'lodash/isEqual';
import { v4 as uuidv4 } from 'uuid';

import {
	generateAddresses,
	getCurrentWallet,
	getKeyDerivationPathObject,
	getSelectedAddressType,
	getSelectedNetwork,
	getSelectedWallet,
	refreshWallet,
} from './index';
import {
	clearUtxos,
	replaceImpactedAddresses,
} from '../../store/actions/wallet';
import { addWarning } from '../../store/actions/checks';
import {
	EWarningIds,
	TAddressStorageCheckRes,
	TGetImpactedAddressesRes,
	TImpactedAddresses,
	TImpactedAddressesData,
	TMinMaxAddressData,
	TMinMaxData,
} from '../../store/types/checks';
import {
	reportImpactedAddressBalance,
	reportUnreportedWarnings,
} from '../checks';
import { addressTypes } from '../../store/shapes/wallet';

export const runChecks = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
}): Promise<Result<{ ranStorageCheck: boolean }>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const storageCheckRes = await runStorageCheck({
		selectedWallet,
		selectedNetwork,
	});
	let ranStorageCheck = false;
	if (storageCheckRes.isOk()) {
		ranStorageCheck = true;
	}

	reportUnreportedWarnings({ selectedWallet, selectedNetwork }).then();

	return ok({
		ranStorageCheck,
	});
};

/**
 * Performs the address storage check and resolves any discrepancies if needed.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {boolean} [allAddressTypes]
 * @returns {Promise<Result<string>>}
 */
export const runStorageCheck = async ({
	selectedWallet,
	selectedNetwork,
	allAddressTypes = false,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
	allAddressTypes?: boolean;
}): Promise<Result<string>> => {
	if (!selectedWallet) {
		getSelectedWallet();
	}
	if (!selectedNetwork) {
		getSelectedNetwork();
	}
	const selectedAddressType = getSelectedAddressType({
		selectedWallet,
		selectedNetwork,
	});
	let addressTypesToCheck = [addressTypes[selectedAddressType]];
	if (allAddressTypes) {
		addressTypesToCheck = Object.values(addressTypes);
	}
	const addressStorageCheckRes = await addressStorageCheck({
		selectedWallet,
		selectedNetwork,
		addressTypesToCheck,
	});
	if (addressStorageCheckRes.isErr()) {
		return err('Invalid Address Storage Check');
	}
	if (addressStorageCheckRes.value.allMatch) {
		return ok('All Match');
	}
	// If the stored and generated addresses don't match we need to retrieve the impacted addresses.
	const getImpactedAddressesRes = await getImpactedAddresses({
		selectedWallet,
		selectedNetwork,
		storageCheckData: addressStorageCheckRes.value.data,
	});
	if (getImpactedAddressesRes.isErr()) {
		return err('Invalid getImpactedAddresses Check');
	}
	// Once we have the impacted addresses in storage we need to replace them with the newly generated addresses.
	const replaceImpactedAddressesRes = await replaceImpactedAddresses({
		impactedAddresses: getImpactedAddressesRes.value,
	});

	if (replaceImpactedAddressesRes.isErr()) {
		return err(replaceImpactedAddressesRes.error.message);
	}

	let warningReported = false;

	// Report the impacted address balance.
	const reportRes = await reportImpactedAddressBalance({
		selectedNetwork,
		impactedAddressRes: getImpactedAddressesRes.value,
	});
	if (reportRes.isOk()) {
		warningReported = true;
	}

	// Add/Save warning info locally in the event it's needed for future use and debugging.
	addWarning({
		warning: {
			id: uuidv4(),
			warningId: EWarningIds.storageCheck,
			data: getImpactedAddressesRes.value,
			warningReported,
			timestamp: new Date().getTime(),
		},
		selectedWallet,
		selectedNetwork,
	});

	await clearUtxos({ selectedWallet, selectedNetwork });

	await refreshWallet({
		onchain: true,
		lightning: true,
		scanAllAddresses: true,
		updateAllAddressTypes: allAddressTypes,
		showNotification: false,
	});

	return ok('Replaced Impacted Addresses');
};

/**
 * Checks the first and last address indexes in storage and compares them to
 * a freshly generated set of addresses to ensure they match as expected.
 * Any mismatch could be the result of a memory/storage bug.
 * See https://github.com/synonymdev/bitkit/issues/826 for more info.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {IAddressTypeData[]} [addressTypesToCheck]
 * @returns {Promise<Result<TAddressStorageCheckRes>>}
 */
export const addressStorageCheck = async ({
	selectedWallet,
	selectedNetwork,
	addressTypesToCheck,
}: {
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	addressTypesToCheck?: IAddressTypeData[];
}): Promise<Result<TAddressStorageCheckRes>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const { currentWallet } = getCurrentWallet({
		selectedWallet,
		selectedNetwork,
	});
	if (!addressTypesToCheck) {
		addressTypesToCheck = Object.values(addressTypes);
	}

	const minMaxData: TMinMaxData[] = [];

	for await (const addressType of addressTypesToCheck) {
		const keyDerivationPathResponse = getKeyDerivationPathObject({
			selectedNetwork,
			path: addressType.path,
		});
		if (keyDerivationPathResponse.isErr()) {
			return err(keyDerivationPathResponse.error.message);
		}
		const keyDerivationPath = keyDerivationPathResponse.value;

		const storedAddresses =
			currentWallet.addresses[selectedNetwork][addressType.type];
		const minMaxAddresses = getMinMaxObjects<IAddress>({
			arr: Object.values(storedAddresses),
			key: 'index',
		});

		const storedChangeAddresses =
			currentWallet.changeAddresses[selectedNetwork][addressType.type];
		const minMaxChangeAddresses = getMinMaxObjects<IAddress>({
			arr: Object.values(storedChangeAddresses),
			key: 'index',
		});

		if (
			minMaxChangeAddresses.min === undefined ||
			minMaxChangeAddresses.max === undefined
		) {
			// In the event addresses haven't been generated yet.
			return err('Invalid Check');
		}

		const address = await _createMinMaxData({
			selectedWallet,
			selectedNetwork,
			addressType: addressType.type,
			keyDerivationPath,
			minMaxAddresses,
			isChangeAddress: false,
		});
		if (address.isErr()) {
			return err(address.error.message);
		}
		const changeAddress = await _createMinMaxData({
			selectedWallet,
			selectedNetwork,
			addressType: addressType.type,
			keyDerivationPath,
			minMaxAddresses: minMaxChangeAddresses,
			isChangeAddress: true,
		});
		if (changeAddress.isErr()) {
			return err(changeAddress.error.message);
		}

		const data: TMinMaxData = {
			address: address.value,
			changeAddress: changeAddress.value,
			addressType: addressType.type,
			selectedNetwork,
		};
		minMaxData.push(data);
	}
	const allMatch = minMaxData.every((data) => {
		return (
			data.address.minMatch &&
			data.address.maxMatch &&
			data.changeAddress.minMatch &&
			data.changeAddress.maxMatch
		);
	});
	return ok({
		allMatch,
		data: minMaxData,
	});
};

/**
 * Generates specified addresses and formats them as needed for addressStorageCheck.
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @param {EAddressType} addressType
 * @param {IKeyDerivationPath} keyDerivationPath
 * @param {TGetMinMaxObject<IAddress>} minMaxAddresses
 * @param {boolean} isChangeAddress
 * @returns {Promise<Result<TMinMaxAddressData>>}
 */
const _createMinMaxData = async ({
	selectedWallet,
	selectedNetwork,
	addressType,
	keyDerivationPath,
	minMaxAddresses,
	isChangeAddress,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
	addressType: EAddressType;
	keyDerivationPath: IKeyDerivationPath;
	minMaxAddresses: TGetMinMaxObject<IAddress>;
	isChangeAddress: boolean;
}): Promise<Result<TMinMaxAddressData>> => {
	const data: TMinMaxAddressData = {
		maxGeneratedAddress: undefined,
		maxMatch: false,
		maxStoredAddress: undefined,
		minGeneratedAddress: undefined,
		minMatch: false,
		minStoredAddress: undefined,
	};
	if (minMaxAddresses.min === undefined || minMaxAddresses.max === undefined) {
		return err('Invalid MinMax Check');
	}
	const minStoredAddress = minMaxAddresses.min;
	const minStoredAddressIndex = minStoredAddress.index;
	const minGeneratedAddress = await generateAddresses({
		selectedNetwork,
		selectedWallet,
		addressAmount: isChangeAddress ? 0 : 1,
		changeAddressAmount: isChangeAddress ? 1 : 0,
		addressIndex: minStoredAddressIndex,
		addressType,
		keyDerivationPath,
	});
	if (minGeneratedAddress.isErr()) {
		return err(minGeneratedAddress.error.message);
	}
	const minAddress = isChangeAddress
		? minGeneratedAddress.value.changeAddresses
		: minGeneratedAddress.value.addresses;
	const _minGeneratedAddress = Object.values(minAddress)[0];
	const minMatch =
		minStoredAddress &&
		minStoredAddress.address === _minGeneratedAddress.address;
	data.minStoredAddress = minStoredAddress;
	data.minGeneratedAddress = _minGeneratedAddress;
	data.minMatch = minMatch;

	const maxStoredAddress = minMaxAddresses.max;
	const maxStoredAddressIndex = maxStoredAddress.index;
	const maxGeneratedAddress = await generateAddresses({
		selectedNetwork,
		selectedWallet,
		addressAmount: isChangeAddress ? 0 : 1,
		changeAddressAmount: isChangeAddress ? 1 : 0,
		addressIndex: maxStoredAddressIndex,
		changeAddressIndex: maxStoredAddressIndex,
		addressType,
		keyDerivationPath,
	});
	if (maxGeneratedAddress.isErr()) {
		return err(maxGeneratedAddress.error.message);
	}

	const maxAddress = isChangeAddress
		? maxGeneratedAddress.value.changeAddresses
		: maxGeneratedAddress.value.addresses;
	const _maxGeneratedAddress: IAddress = Object.values(maxAddress)[0];
	const maxMatch =
		maxStoredAddress &&
		maxStoredAddress.address === _maxGeneratedAddress.address;
	data.maxStoredAddress = maxStoredAddress;
	data.maxGeneratedAddress = _maxGeneratedAddress;
	data.maxStoredAddress = maxStoredAddress;
	data.maxMatch = maxMatch;
	return ok(data);
};

/**
 * Returns impacted addresses or stored addresses that do not match their generated counterparts.
 * @param {TWalletName} selectedWallet]
 * @param {TAvailableNetworks} selectedNetwork]
 * @param {TMinMaxData[]} data
 * @returns {TGetImpactedAddressesRes}
 */
export const getImpactedAddresses = async ({
	selectedWallet,
	selectedNetwork,
	storageCheckData,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
	storageCheckData: TMinMaxData[]; // Retrieved by calling addressStorageCheck
}): Promise<Result<TGetImpactedAddressesRes>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const { currentWallet } = getCurrentWallet({
		selectedWallet,
		selectedNetwork,
	});

	let impactedAddresses: TImpactedAddresses[] = [];
	let impactedChangeAddresses: TImpactedAddresses[] = [];

	for await (const {
		address,
		changeAddress,
		addressType,
	} of storageCheckData) {
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
		const keyDerivationPath = keyDerivationPathResponse.value;

		const storedAddresses = Object.values(
			currentWallet.addresses[selectedNetwork][addressType],
		);
		const storedChangeAddresses = Object.values(
			currentWallet.changeAddresses[selectedNetwork][addressType],
		);

		const allGeneratedAddresses = await generateAddresses({
			selectedWallet,
			selectedNetwork,
			addressAmount: (address.maxGeneratedAddress?.index ?? 0) + 1,
			changeAddressAmount: (changeAddress.maxGeneratedAddress?.index ?? 0) + 1,
			addressIndex: address.minGeneratedAddress?.index ?? 0,
			changeAddressIndex: changeAddress.minGeneratedAddress?.index ?? 0,
			keyDerivationPath,
			addressType,
		});

		if (allGeneratedAddresses.isErr()) {
			return err(allGeneratedAddresses.error.message);
		}

		const generatedAddresses = Object.values(
			allGeneratedAddresses.value.addresses,
		);
		const generatedChangeAddresses = Object.values(
			allGeneratedAddresses.value.changeAddresses,
		);

		const _impactedAddresses = _getMismatchedAddresses({
			storedAddresses,
			generatedAddresses,
		});
		const _impactedChangeAddresses = _getMismatchedAddresses({
			storedAddresses: storedChangeAddresses,
			generatedAddresses: generatedChangeAddresses,
		});

		if (_impactedAddresses.length > 0) {
			impactedAddresses = impactedAddresses.concat({
				addressType,
				addresses: _impactedAddresses,
			});
		}
		if (_impactedChangeAddresses.length > 0) {
			impactedChangeAddresses = impactedChangeAddresses.concat({
				addresses: _impactedChangeAddresses,
				addressType,
			});
		}
	}

	return ok({ impactedAddresses, impactedChangeAddresses });
};

const _getMismatchedAddresses = ({
	storedAddresses,
	generatedAddresses,
}: {
	storedAddresses: IAddress[];
	generatedAddresses: IAddress[];
}): TImpactedAddressesData[] => {
	let impactedAddresses: TImpactedAddressesData[] = [];
	storedAddresses.forEach((storedAddress) => {
		const generatedAddress = generatedAddresses.find(
			(a) => a.index === storedAddress.index,
		);
		if (generatedAddress && !isEqual(generatedAddress, storedAddress)) {
			impactedAddresses.push({ storedAddress, generatedAddress });
		}
	});
	return impactedAddresses;
};
