import { TAvailableNetworks } from '../networks';
import {
	EAddressType,
	IAddress,
	IKeyDerivationPath,
	TKeyDerivationAccountType,
	TWalletName,
} from '../../store/types/wallet';

export interface IResponse<T> {
	error: boolean;
	data: T;
}

export interface ISetKeychainValue {
	key: string;
	value: string;
}

export interface IGetKeychainValue {
	key: string;
}

export interface IGetAddress {
	path: string;
	type: EAddressType;
	selectedNetwork?: TAvailableNetworks;
}

export interface IGetAddressResponse {
	address: string;
	path: string;
	publicKey: string;
}

export interface IGetInfoFromAddressPath {
	error: boolean;
	isChangeAddress?: boolean;
	addressIndex?: number;
	data?: string;
}

export interface IGenerateAddresses {
	selectedWallet?: TWalletName;
	addressAmount?: number;
	changeAddressAmount?: number;
	addressIndex?: number;
	changeAddressIndex?: number;
	selectedNetwork?: TAvailableNetworks;
	keyDerivationPath?: IKeyDerivationPath;
	accountType?: TKeyDerivationAccountType;
	addressType?: string;
	seed?: Buffer;
}

export interface IGenerateAddressesResponse {
	addresses: IAddress;
	changeAddresses: IAddress;
}
