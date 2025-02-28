import { ECoinSelectPreference, EProtocol, TServer } from 'beignet';
import cloneDeep from 'lodash/cloneDeep';
import { getCurrencies } from 'react-native-localize';

import {
	__E2E__,
	__ELECTRUM_REGTEST_HOST__,
	__ELECTRUM_REGTEST_PROTO__,
	__ELECTRUM_REGTEST_SSL_PORT__,
	__ELECTRUM_REGTEST_TCP_PORT__,
	__WEB_RELAY__,
} from '../../constants/env';
import { currencies } from '../../utils/exchange-rate/currencies';
import { EAvailableNetwork } from '../../utils/networks';
import { TSettings } from '../slices/settings';
import { ETransactionSpeed } from '../types/settings';
import { EDenomination, EUnit } from '../types/wallet';

const getDefaultCurrency = (): string => {
	if (__E2E__) {
		return 'USD';
	}

	const localCurrencies = getCurrencies();

	// Find the first currency that matches the user's preference
	const preferredCurrency = localCurrencies.find((currency) => {
		return currencies.includes(currency);
	});

	return preferredCurrency ?? 'USD';
};

export const defaultElectrumPeer: Record<EAvailableNetwork, TServer[]> = {
	bitcoin: [
		{
			host: '35.187.18.233',
			tcp: 8911,
			ssl: 8900,
			protocol: EProtocol.ssl,
		},
	],
	bitcoinTestnet: [
		{
			host: 'testnet.hsmiths.com',
			tcp: 53012,
			ssl: 53012,
			protocol: EProtocol.ssl,
		},
		{
			host: 'tn.not.fyi',
			tcp: 55002,
			ssl: 55002,
			protocol: EProtocol.ssl,
		},
		{
			host: 'testnet.aranguren.org',
			tcp: 51001,
			ssl: 51002,
			protocol: EProtocol.ssl,
		},
		{
			host: 'blackie.c3-soft.com',
			tcp: 57006,
			ssl: 57006,
			protocol: EProtocol.ssl,
		},
	],
	bitcoinRegtest: [
		{
			host: __ELECTRUM_REGTEST_HOST__,
			tcp: __ELECTRUM_REGTEST_TCP_PORT__,
			ssl: __ELECTRUM_REGTEST_SSL_PORT__,
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
	selectedCurrency: getDefaultCurrency(),
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
