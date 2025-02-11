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
