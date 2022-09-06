import { ISettings } from '../types/settings';

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
	balanceUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	selectedCurrency: 'USD',
	selectedLanguage: 'english',
	selectedNetwork: 'bitcoinRegtest',
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
	showSuggestions: true,
	transactionSpeed: 'normal',
	hideBalance: false,
	hideBeta: false,
	addressType: 'p2wpkh',
};
