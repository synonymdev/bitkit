import { ISettings } from '../types/settings';

//TODO: Remove the public Electrum servers below once we spin up our own.
const customElectrumPeers = {
	bitcoin: [
		{
			host: '35.187.18.233',
			ssl: 8912,
			tcp: 8911,
			protocol: 'tcp',
		},
	],
	bitcoinTestnet: [
		{
			host: 'testnet.hsmiths.com',
			ssl: 53012,
			tcp: 53012,
			protocol: 'ssl',
		},
		{
			host: 'tn.not.fyi',
			ssl: 55002,
			tcp: 55002,
			protocol: 'ssl',
		},
		{
			host: 'testnet.aranguren.org',
			ssl: 51002,
			tcp: 51001,
			protocol: 'ssl',
		},
		{
			host: 'blackie.c3-soft.com',
			ssl: 57006,
			tcp: 57006,
			protocol: 'ssl',
		},
	],
	bitcoinRegtest: [
		{
			host: '35.233.47.252',
			ssl: 18484,
			tcp: 18483,
			protocol: 'tcp',
		},
	],
	timestamp: null,
};

const defaultReceivePreference = [
	{
		key: 'lightning',
		title: 'Lightning (Bitkit)',
	},
	{
		key: 'onchain',
		title: 'On-chain (Bitkit)',
	},
	{
		key: 'lnurlpay',
		title: 'LNURL-pay',
	},
];

export const defaultSettingsShape: ISettings = {
	loading: false,
	error: false,
	allowClipboard: false,
	enableSendAmountWarning: false,
	pin: false,
	pinOnLaunch: true,
	pinForPayments: false,
	biometrics: false,
	rbf: true,
	theme: 'dark',
	bitcoinUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	balanceUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	selectedCurrency: 'USD',
	selectedLanguage: 'english',
	customElectrumPeers,
	coinSelectAuto: true,
	coinSelectPreference: 'small',
	receivePreference: defaultReceivePreference,
	enableOfflinePayments: true,
	unitPreference: 'asset',
	showSuggestions: true,
	transactionSpeed: 'normal',
	hideBalance: false,
	hideOnboardingMessage: false,
	hideBeta: false,
	enableDevOptions: false,
};
