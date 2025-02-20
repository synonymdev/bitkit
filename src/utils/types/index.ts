import { EAddressType, IKeyDerivationPath } from 'beignet';
import {
	TKeyDerivationAccountType,
	TWalletName,
} from '../../store/types/wallet';
import { EAvailableNetwork } from '../networks';

export interface IGetAddress {
	path: string;
	selectedNetwork?: EAvailableNetwork;
}

export interface IGenerateAddresses {
	selectedWallet?: TWalletName;
	addressAmount?: number;
	changeAddressAmount?: number;
	addressIndex?: number;
	changeAddressIndex?: number;
	selectedNetwork?: EAvailableNetwork;
	keyDerivationPath?: IKeyDerivationPath;
	accountType?: TKeyDerivationAccountType;
	addressType?: EAddressType;
	seed?: Buffer;
}
