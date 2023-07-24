import cloneDeep from 'lodash.clonedeep';
import { TAvailableNetworks } from '@synonymdev/react-native-ldk';

import {
	__ELECTRUM_BITCOIN_HOST__,
	__ELECTRUM_BITCOIN_PROTO__,
	__ELECTRUM_BITCOIN_SSL_PORT__,
	__ELECTRUM_BITCOIN_TCP_PORT__,
	__ELECTRUM_REGTEST_HOST__,
	__ELECTRUM_REGTEST_PROTO__,
	__ELECTRUM_REGTEST_SSL_PORT__,
	__ELECTRUM_REGTEST_TCP_PORT__,
	__ELECTRUM_SIGNET_HOST__,
	__ELECTRUM_SIGNET_PROTO__,
	__ELECTRUM_SIGNET_SSL_PORT__,
	__ELECTRUM_SIGNET_TCP_PORT__,
} from '../../constants/env';
import {
	ETransactionSpeed,
	ICustomElectrumPeer,
	ISettings,
} from '../types/settings';
import { EUnit } from '../types/wallet';
import { IWidgetsStore } from '../types/widgets';

//TODO: Remove the public Electrum servers below once we spin up our own.
export const origCustomElectrumPeers: Record<
	TAvailableNetworks,
	ICustomElectrumPeer[]
> = {
	bitcoin: [
		{
			host: __ELECTRUM_BITCOIN_HOST__,
			ssl: __ELECTRUM_BITCOIN_SSL_PORT__,
			tcp: __ELECTRUM_BITCOIN_TCP_PORT__,
			protocol: __ELECTRUM_BITCOIN_PROTO__,
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
			host: __ELECTRUM_REGTEST_HOST__,
			ssl: __ELECTRUM_REGTEST_SSL_PORT__,
			tcp: __ELECTRUM_REGTEST_TCP_PORT__,
			protocol: __ELECTRUM_REGTEST_PROTO__,
		},
	],
	bitcoinSignet: [
		{
			host: __ELECTRUM_SIGNET_HOST__,
			ssl: __ELECTRUM_SIGNET_SSL_PORT__,
			tcp: __ELECTRUM_SIGNET_TCP_PORT__,
			protocol: __ELECTRUM_SIGNET_PROTO__,
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
];

export const defaultSettingsShape: Readonly<ISettings> = {
	enableAutoReadClipboard: false,
	enableSendAmountWarning: false,
	pin: false,
	pinOnLaunch: true,
	pinOnIdle: false,
	pinForPayments: false,
	biometrics: false,
	rbf: false,
	theme: 'dark',
	unit: EUnit.satoshi,
	selectedCurrency: 'USD',
	selectedLanguage: 'english',
	customElectrumPeers: origCustomElectrumPeers,
	coinSelectAuto: true,
	coinSelectPreference: 'small',
	receivePreference: defaultReceivePreference,
	enableOfflinePayments: true,
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
