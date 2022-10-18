import {
	IWalletItem,
	TBitcoinUnit,
	TBalanceUnit,
	TAddressType,
} from './wallet';

type TTheme = 'dark' | 'light' | 'blue';
export type TProtocol = 'ssl' | 'tcp' | string;

type TTransactionSpeed = 'normal' | 'fast' | 'slow';

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

type TReceiveOption = {
	key: string;
	title: string;
};

export interface ISettings {
	loading: boolean;
	error: boolean;
	allowClipboard: boolean;
	enableSendAmountWarning: boolean;
	pin: boolean;
	pinOnLaunch: boolean;
	pinForPayments: boolean;
	biometrics: boolean;
	rbf: boolean;
	theme: TTheme;
	bitcoinUnit: TBitcoinUnit;
	balanceUnit: TBalanceUnit;
	customElectrumPeers: IWalletItem<ICustomElectrumPeer[]> | IWalletItem<[]>;
	selectedCurrency: string;
	selectedLanguage: string;
	coinSelectAuto: boolean;
	coinSelectPreference: TCoinSelectPreference;
	receivePreference: TReceiveOption[];
	enableOfflinePayments: boolean;
	unitPreference: 'asset' | 'fiat';
	showSuggestions: boolean;
	transactionSpeed: TTransactionSpeed;
	addressType: TAddressType;
	hideBalance: boolean;
	hideOnboardingMessage: boolean;
	hideBeta: boolean;
	enableDevOptions: boolean;
}
