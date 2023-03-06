import { TAvailableNetworks } from '@synonymdev/react-native-ldk';
import {
	ELECTRUM_BITCOIN_HOST,
	ELECTRUM_BITCOIN_SSL_PORT,
	ELECTRUM_BITCOIN_TCP_PORT,
	ELECTRUM_BITCOIN_PROTO,
	ELECTRUM_REGTEST_HOST,
	ELECTRUM_REGTEST_SSL_PORT,
	ELECTRUM_REGTEST_TCP_PORT,
	ELECTRUM_REGTEST_PROTO,
} from '@env';

import {
	ETransactionSpeed,
	ICustomElectrumPeer,
	ISettings,
} from '../types/settings';
import { EBalanceUnit, EBitcoinUnit } from '../types/wallet';
import { IWidgetsStore } from '../types/widgets';
import cloneDeep from 'lodash.clonedeep';

//TODO: Remove the public Electrum servers below once we spin up our own.
export const origCustomElectrumPeers: Record<
	TAvailableNetworks,
	ICustomElectrumPeer[]
> = {
	bitcoin: [
		{
			host: ELECTRUM_BITCOIN_HOST,
			ssl: ELECTRUM_BITCOIN_SSL_PORT,
			tcp: ELECTRUM_BITCOIN_TCP_PORT,
			protocol: ELECTRUM_BITCOIN_PROTO,
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
			host: ELECTRUM_REGTEST_HOST,
			ssl: ELECTRUM_REGTEST_SSL_PORT,
			tcp: ELECTRUM_REGTEST_TCP_PORT,
			protocol: ELECTRUM_REGTEST_PROTO,
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

export const defaultSettingsShape: Readonly<ISettings> = {
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
	customFeeRate: 0,
	hideBalance: false,
	hideOnboardingMessage: false,
	hideBeta: false,
	enableDevOptions: __DEV__,
};

export const getDefaultSettingsShape = (): IWidgetsStore => {
	return cloneDeep(defaultSettingsShape);
};
