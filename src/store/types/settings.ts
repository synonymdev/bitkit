import { IWalletItem, TBitcoinUnit, TBalanceUnit } from './wallet';
import { EExchangeRateService } from '../../utils/exchange-rate/types';

type TTheme = 'dark' | 'light' | 'blue';
export type TProtocol = 'ssl' | 'tcp' | string;

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

export interface ISettings {
	loading: boolean;
	error: boolean;
	biometrics: boolean;
	pin: boolean;
	pinOnLaunch: boolean;
	pinForPayments: boolean;
	rbf: boolean;
	theme: TTheme;
	bitcoinUnit: TBitcoinUnit;
	balanceUnit: TBalanceUnit;
	customElectrumPeers: IWalletItem<ICustomElectrumPeer[]> | IWalletItem<[]>;
	selectedCurrency: string;
	exchangeRateService: EExchangeRateService;
	selectedLanguage: string;
	coinSelectAuto: boolean;
	coinSelectPreference: TCoinSelectPreference;
	unitPreference: 'asset' | 'fiat';
	[key: string]: any;
}

export type RadioButtonItem = { label: string; value: string };
