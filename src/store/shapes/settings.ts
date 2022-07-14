import { ISettings } from '../types/settings';
import { EExchangeRateService } from '../../utils/exchange-rate/types';

export const defaultSettingsShape: ISettings = {
	loading: false,
	error: false,
	biometrics: false,
	pin: false,
	pinOnLaunch: false,
	pinForPayments: false,
	rbf: true,
	theme: 'dark',
	bitcoinUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	balaceUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	selectedCurrency: 'USD',
	exchangeRateService: EExchangeRateService.bitfinex,
	selectedLanguage: 'english',
	customElectrumPeers: {
		bitcoin: [],
		bitcoinTestnet: [],
		bitcoinRegtest: [
			{
				host: '35.233.47.252',
				ssl: 18484,
				tcp: 18483,
				protocol: 'tcp',
			},
		],
		timestamp: null,
	},
	coinSelectAuto: true,
	coinSelectPreference: 'small',
	unitPreference: 'asset',
	hideBalance: false,
};
