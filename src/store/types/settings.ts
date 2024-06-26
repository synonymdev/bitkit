import { EProtocol } from 'beignet';
import { IWalletItem } from './wallet';

export type TTheme = 'dark' | 'light';

export const isProtocol = (protocol: unknown): protocol is EProtocol => {
	if (typeof protocol === 'string') {
		return Object.values(EProtocol).includes(protocol as EProtocol);
	}
	return false;
};

export enum ETransactionSpeed {
	fast = 'fast',
	normal = 'normal',
	slow = 'slow',
	custom = 'custom',
}

export enum EAppIcon {
	orange = 'orange',
	black = 'black',
}

/**
 * large = Sort by and use largest UTXO first. Lowest fee, but reveals your largest UTXO's.
 * small = Sort by and use smallest UTXO first. Higher fee, but hides your largest UTXO's.
 * consolidate = Use all available UTXO's regardless of the amount being sent. Preferable to use this method when fees are low in order to reduce fees in future transactions.
 */
export type TCoinSelectPreference = 'small' | 'large' | 'consolidate';

export interface ICustomElectrumPeer {
	host: string;
	ssl: number; //ssl port
	tcp: number; //tcp port
	protocol: EProtocol;
}

export type TReceiveOption = {
	key: string;
	title: string;
};

export type TCustomElectrumPeers = IWalletItem<ICustomElectrumPeer[]>;

export type TChest = {
	chestId: string;
	state: 'found' | 'opened' | 'claimed' | 'success' | 'failed';
	isAirdrop?: boolean;
	shortId?: string;
	attemptId?: string;
	winType?: 'winning' | 'consolation' | 'empty';
};
