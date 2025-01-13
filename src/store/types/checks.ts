import { TChannel } from '@synonymdev/react-native-ldk';
import { EAddressType, IAddress } from 'beignet';
import { EAvailableNetwork } from '../../utils/networks';
import { IWalletItem, TWalletName } from './wallet';

export enum EWarningIds {
	storageCheck = 888,
	ldkMigration = 999,
}

export type TMinMaxAddressData = {
	minGeneratedAddress: IAddress | undefined;
	maxGeneratedAddress: IAddress | undefined;
	minStoredAddress: IAddress | undefined;
	maxStoredAddress: IAddress | undefined;
	minMatch: boolean;
	maxMatch: boolean;
};

export type TMinMaxData = {
	address: TMinMaxAddressData;
	changeAddress: TMinMaxAddressData;
	addressType: EAddressType;
	selectedNetwork: EAvailableNetwork;
};

export type TAddressStorageCheckRes = {
	allMatch: boolean;
	data: TMinMaxData[];
};

export type TImpactedAddressesData = {
	storedAddress: IAddress;
	generatedAddress: IAddress;
};

export type TGetImpactedAddressesRes = {
	impactedAddresses: TImpactedAddresses[];
	impactedChangeAddresses: TImpactedAddresses[];
};

export type TImpactedAddresses = {
	addressType: EAddressType;
	addresses: TImpactedAddressesData[];
};

export type TStorageWarning = {
	id: string;
	warningId: EWarningIds;
	data: TGetImpactedAddressesRes | TChannel;
	warningReported: boolean;
	timestamp: number;
};

export interface IChecksShape {
	[key: TWalletName]: IChecksContent;
}

export interface IChecksContent {
	warnings: IWalletItem<TStorageWarning[]>;
}
