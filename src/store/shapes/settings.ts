import { ISettings } from '../types/settings';

//TODO: Remove the public Electrum servers below once we spin up our own.
const customElectrumPeers = {
	bitcoin: [
		{
			host: 'kirsche.emzy.de',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
		},
		{
			host: 'electrum.emzy.de',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
		},
		{
			host: 'de.poiuty',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
		},
		{
			host: 'electrum.coinext.com.br',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
		},
		{
			host: 'fortress.qtornado.com',
			ssl: 443,
			tcp: 442,
			protocol: 'ssl',
		},
		{
			host: '157.245.172.236',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
		},
		{
			host: 'electrumx.alexridevski.net',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
		},
		{
			host: 'electrumx.info',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
		},
		{
			host: '178.62.80.20',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
		},
		{
			host: 'node1.btccuracao.com',
			ssl: 50002,
			tcp: 50001,
			protocol: 'ssl',
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
	biometrics: false,
	pin: false,
	pinOnLaunch: true,
	pinForPayments: false,
	rbf: true,
	theme: 'dark',
	bitcoinUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	balanceUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	selectedCurrency: 'USD',
	selectedLanguage: 'english',
	selectedNetwork: 'bitcoinRegtest',
	customElectrumPeers,
	coinSelectAuto: true,
	coinSelectPreference: 'small',
	receivePreference: defaultReceivePreference,
	enableOfflinePayments: true,
	unitPreference: 'asset',
	showSuggestions: true,
	transactionSpeed: 'normal',
	hideBalance: false,
	hideBeta: false,
	addressType: 'p2wpkh',
};
