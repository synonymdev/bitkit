import { ECoinSelectPreference, EProtocol, TServer } from 'beignet';
import cloneDeep from 'lodash/cloneDeep';

import {
	__ELECTRUM_BITCOIN_HOST__,
	__ELECTRUM_BITCOIN_PROTO__,
	__ELECTRUM_BITCOIN_SSL_PORT__,
	__ELECTRUM_BITCOIN_TCP_PORT__,
	__ELECTRUM_REGTEST_HOST__,
	__ELECTRUM_REGTEST_PROTO__,
	__ELECTRUM_REGTEST_SSL_PORT__,
	__ELECTRUM_REGTEST_TCP_PORT__,
	__WEB_RELAY__,
} from '../../constants/env';
import { EAvailableNetwork } from '../../utils/networks';
import { TSettings } from '../slices/settings';
import { ETransactionSpeed } from '../types/settings';
import { EDenomination, EUnit } from '../types/wallet';

export const defaultElectrumPeer: Record<EAvailableNetwork, TServer[]> = {
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
			protocol: EProtocol.ssl,
		},
		{
			host: 'tn.not.fyi',
			ssl: 55002,
			tcp: 55002,
			protocol: EProtocol.ssl,
		},
		{
			host: 'testnet.aranguren.org',
			ssl: 51002,
			tcp: 51001,
			protocol: EProtocol.ssl,
		},
		{
			host: 'blackie.c3-soft.com',
			ssl: 57006,
			tcp: 57006,
			protocol: EProtocol.ssl,
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

export const initialSettingsState: TSettings = {
	enableAutoReadClipboard: false,
	enableSendAmountWarning: false,
	enableSwipeToHideBalance: true,
	pin: false,
	pinOnLaunch: true,
	pinOnIdle: false,
	pinForPayments: false,
	biometrics: false,
	rbf: true,
	theme: 'dark',
	unit: EUnit.BTC,
	denomination: EDenomination.modern,
	selectedCurrency: 'USD',
	selectedLanguage: 'english',
	customElectrumPeers: defaultElectrumPeer,
	rapidGossipSyncUrl: 'https://rgs.blocktank.to/snapshot/',
	coinSelectAuto: true,
	coinSelectPreference: ECoinSelectPreference.small,
	receivePreference: defaultReceivePreference,
	enableDevOptions: __DEV__,
	enableOfflinePayments: false,
	enableQuickpay: false,
	quickpayAmount: 5,
	showWidgets: true,
	showWidgetTitles: false,
	transactionSpeed: ETransactionSpeed.normal,
	customFeeRate: 0,
	hideBalance: false,
	hideBalanceOnOpen: false,
	hideOnboardingMessage: false,
	treasureChests: [],
	orangeTickets: [],
	webRelay: __WEB_RELAY__,
	quickpayIntroSeen: false,
	transferIntroSeen: false,
	spendingIntroSeen: false,
	savingsIntroSeen: false,
};

export const getDefaultSettingsShape = (): TSettings => {
	return cloneDeep(initialSettingsState);
};
