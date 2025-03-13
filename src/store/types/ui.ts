import { LNURLPayParams, LNURLWithdrawParams } from 'js-lnurl';
import { AppStateStatus } from 'react-native';
import { ReceiveStackParamList } from '../../sheets/ReceiveNavigation';
import { SendStackParamList } from '../../sheets/SendNavigation';
import { EActivityType, TOnchainActivityItem } from './activity';

// Used to ensure all sheet refs are registered
export const sheetIds: SheetId[] = [
	'activityTags',
	'addContact',
	'appUpdate',
	'backupNavigation',
	'backupPrompt',
	'boost',
	'connectionClosed',
	'datePicker',
	'forceTransfer',
	'forgotPin',
	'highBalance',
	'lnurlWithdraw',
	'orangeTicket',
	'pinNavigation',
	'profileLink',
	'pubkyAuth',
	'quickPay',
	'receive',
	'receivedTx',
	'send',
	'tags',
	'transferFailed',
	'treasureHunt',
];

export type SheetsParamList = {
	addContact: undefined;
	activityTags: { id: string };
	appUpdate: undefined;
	backupNavigation: undefined;
	backupPrompt: undefined;
	boost: { activityItem: TOnchainActivityItem };
	connectionClosed: undefined;
	datePicker: undefined;
	forceTransfer: undefined;
	forgotPin: undefined;
	highBalance: undefined;
	lnurlWithdraw: LNURLWithdrawParams;
	orangeTicket: { ticketId: string };
	pinNavigation: { showLaterButton: boolean };
	profileLink: undefined;
	pubkyAuth: { url: string };
	quickPay: undefined;
	receive: { screen: keyof ReceiveStackParamList } | undefined;
	receivedTx: { id: string; activityType: EActivityType; value: number };
	send:
		| { screen: keyof SendStackParamList }
		| { screen: 'Quickpay'; invoice: string; amount: number }
		| { screen: 'LNURLAmount'; pParams: LNURLPayParams; url: string }
		| {
				screen: 'LNURLConfirm';
				pParams: LNURLPayParams;
				url: string;
				amount?: number;
		  }
		| undefined;
	tags: undefined;
	transferFailed: undefined;
	treasureHunt: { chestId: string };
};

export type SheetId = keyof SheetsParamList;

export type TProfileLink = {
	title: string;
	url: string;
};

export type TAvailableUpdate = {
	version: string;
	buildNumber: number;
	notes: string;
	pub_date: string;
	url: string;
	critical: boolean;
};

export type TSendTransaction = {
	paymentMethod: 'onchain' | 'lightning';
	uri: string;
	fromAddressViewer?: boolean;
};

export type THealthState = 'ready' | 'pending' | 'error';

export type TUiState = {
	appState: AppStateStatus;
	availableUpdate: TAvailableUpdate | null;
	isAuthenticated: boolean;
	isConnectedToElectrum: boolean;
	isElectrumThrottled: boolean;
	isOnline: boolean;
	isLDKReady: boolean;
	language: string;
	profileLink: TProfileLink;
	timeZone: string;
	sendTransaction: TSendTransaction;
};
