import { IWalletItem, TBitcoinUnit, TBalanceUnit } from './wallet';

export type TTheme = 'dark' | 'light' | 'blue';
export type TProtocol = 'ssl' | 'tcp' | string;

export type TTransactionSpeed = 'normal' | 'fast' | 'slow';

/**
 * large = Sort by and use largest UTXO first. Lowest fee, but reveals your largest UTXO's.
 * small = Sort by and use smallest UTXO first. Higher fee, but hides your largest UTXO's.
 * consolidate = Use all available UTXO's regardless of the amount being sent. Preferable to use this method when fees are low in order to reduce fees in future transactions.
 */
export type TCoinSelectPreference = 'small' | 'large' | 'consolidate';

export interface ICustomElectrumPeer {
	host: string;
	ssl: number | undefined; //ssl port
	tcp: number | undefined; //tcp port
	protocol?: TProtocol;
}

export type TReceiveOption = {
	key: string;
	title: string;
};

export type TUnitPreference = 'asset' | 'fiat';

export type TCustomElectrumPeers =
	| IWalletItem<ICustomElectrumPeer[]>
	| IWalletItem<[]>;

export interface ISettings {
	loading: boolean;
	error: boolean;
	enableAutoReadClipboard: boolean;
	enableSendAmountWarning: boolean;
	pin: boolean;
	pinOnLaunch: boolean;
	pinForPayments: boolean;
	biometrics: boolean;
	rbf: boolean;
	theme: TTheme;
	bitcoinUnit: TBitcoinUnit;
	balanceUnit: TBalanceUnit;
	customElectrumPeers: TCustomElectrumPeers;
	selectedCurrency: string;
	selectedLanguage: string;
	coinSelectAuto: boolean;
	coinSelectPreference: TCoinSelectPreference;
	receivePreference: TReceiveOption[];
	enableOfflinePayments: boolean;
	unitPreference: TUnitPreference;
	showSuggestions: boolean;
	transactionSpeed: TTransactionSpeed;
	hideBalance: boolean;
	hideOnboardingMessage: boolean;
	hideBeta: boolean;
	enableDevOptions: boolean;
}
