import { TAvailableNetworks } from '@synonymdev/react-native-ldk';
import {
	ETransactionSpeed,
	ICustomElectrumPeer,
	ISettings,
} from '../types/settings';
import { EBalanceUnit, EBitcoinUnit } from '../types/wallet';

//TODO: Remove the public Electrum servers below once we spin up our own.
export const origCustomElectrumPeers: Record<
	TAvailableNetworks,
	ICustomElectrumPeer[]
> = {
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
	enableAutoReadClipboard: false,
	enableSendAmountWarning: false,
	pin: false,
	pinOnLaunch: true,
	pinForPayments: false,
	biometrics: false,
	rbf: false,
	theme: 'dark',
	bitcoinUnit: EBitcoinUnit.satoshi,
	balanceUnit: EBalanceUnit.satoshi,
	selectedCurrency: 'USD',
	selectedLanguage: 'english',
	customElectrumPeers: origCustomElectrumPeers,
	coinSelectAuto: true,
	coinSelectPreference: 'small',
	receivePreference: defaultReceivePreference,
	enableOfflinePayments: true,
	unitPreference: 'asset',
	showSuggestions: true,
	transactionSpeed: ETransactionSpeed.normal,
	hideBalance: false,
	hideOnboardingMessage: false,
	hideBeta: false,
	enableDevOptions: __DEV__,
};
