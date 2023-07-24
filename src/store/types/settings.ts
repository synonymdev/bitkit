import { IWalletItem, EUnit } from './wallet';

export type TTheme = 'dark' | 'light';

export type TProtocol = 'ssl' | 'tcp';

export const isProtocol = (protocol: string): protocol is TProtocol => {
	return ['tcp', 'ssl'].includes(protocol);
};

export enum ETransactionSpeed {
	fast = 'fast',
	normal = 'normal',
	slow = 'slow',
	custom = 'custom',
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
	protocol: TProtocol;
}

export type TReceiveOption = {
	key: string;
	title: string;
};

export type TCustomElectrumPeers = IWalletItem<ICustomElectrumPeer[]>;

export interface ISettings {
	enableAutoReadClipboard: boolean;
	enableSendAmountWarning: boolean;
	pin: boolean;
	pinOnLaunch: boolean;
	pinOnIdle: boolean;
	pinForPayments: boolean;
	biometrics: boolean;
	rbf: boolean;
	theme: TTheme;
	unit: EUnit;
	customElectrumPeers: TCustomElectrumPeers;
	// TODO: type available currencies
	selectedCurrency: string;
	selectedLanguage: string;
	coinSelectAuto: boolean;
	coinSelectPreference: TCoinSelectPreference;
	receivePreference: TReceiveOption[];
	enableOfflinePayments: boolean;
	showSuggestions: boolean;
	transactionSpeed: ETransactionSpeed;
	customFeeRate: number;
	hideBalance: boolean;
	hideOnboardingMessage: boolean;
	hideBeta: boolean;
	enableDevOptions: boolean;
}
