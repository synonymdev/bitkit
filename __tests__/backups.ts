import SDK from '@synonymdev/slashtags-sdk/index.old';
import RAM from 'random-access-memory';
import { stringToBytes } from '@synonymdev/react-native-lnurl/dist/utils/helpers';

import {
	EBackupCategories,
	fetchBackup,
	uploadBackup,
} from '../src/utils/backup/backpack';
import { bytesToString } from '../src/utils/converters';
import store from '../src/store';
import {
	addTag,
	addMetaTxTag,
	resetMetaStore,
	updateMetaIncTxTags,
	addMetaSlashTagsUrlTag,
} from '../src/store/actions/metadata';
import {
	performBlocktankRestore,
	performLdkActivityRestore,
	performMetadataRestore,
	performRemoteBackup,
	performSettingsRestore,
	performWidgetsRestore,
} from '../src/store/actions/backup';
import {
	getActivityStore,
	getBlocktankStore,
	getDispatch,
	getMetaDataStore,
	getSettingsStore,
	getWidgetsStore,
} from '../src/store/helpers';
import {
	resetSettingsStore,
	updateSettings,
} from '../src/store/actions/settings';
import {
	resetWidgetsStore,
	setFeedWidget,
	updateWidgets,
} from '../src/store/actions/widgets';
import {
	addActivityItem,
	resetActivityStore,
} from '../src/store/actions/activity';
import { EActivityType } from '../src/store/types/activity';
import { EPaymentType } from '../src/store/types/wallet';
import {
	addPaidBlocktankOrder,
	resetBlocktankStore,
} from '../src/store/actions/blocktank';
import actions from '../src/store/actions/actions';
import { defaultOrderResponse } from '../src/store/shapes/blocktank';

jest.setTimeout(30000);

describe('Remote backups', () => {
	let sdk, slashtag;
	beforeAll(async () => {
		sdk = new SDK({
			primaryKey: new Uint8Array(32), //For testing, so we don't fill up server with junk after each test
			storage: RAM,
			relay: 'wss://dht-relay.synonym.to',
		});
		await sdk.ready();
		slashtag = sdk.slashtag();
	});

	afterAll(async () => {
		await sdk.close();
	});

	it('Backups up and restores a blob', async () => {
		const message = 'Back me up plz';
		const category = EBackupCategories.jest;

		const uploadRes = await uploadBackup(
			slashtag,
			stringToBytes(message),
			category,
			'bitcoinRegtest',
		);

		if (uploadRes.isErr()) {
			throw uploadRes.error;
		}

		const timestamp = uploadRes.value;

		const fetchRes = await fetchBackup(
			slashtag,
			timestamp,
			category,
			'bitcoinRegtest',
		);

		if (fetchRes.isErr()) {
			throw fetchRes.error;
		}

		expect(bytesToString(fetchRes.value.content)).toEqual(message);
	});

	it('Backups and restores metadata', async () => {
		addMetaTxTag('txid1', 'tag');
		addTag('tag');
		updateMetaIncTxTags('address', 'invoice', ['futuretag']);
		addMetaSlashTagsUrlTag('txid2', 'slashtag');

		const backup = getMetaDataStore();

		const uploadRes = await performRemoteBackup({
			slashtag,
			isSyncedKey: 'remoteMetadataBackupSynced',
			backupCategory: EBackupCategories.metadata,
			backup,
		});

		if (uploadRes.isErr()) {
			throw uploadRes.error;
		}

		resetMetaStore();
		expect(store.getState().metadata.tags).toMatchObject({});

		const restoreRes = await performMetadataRestore({
			slashtag,
		});

		if (restoreRes.isErr()) {
			throw restoreRes.error;
		}

		expect(restoreRes.value.backupExists).toEqual(true);
		expect(store.getState().metadata).toEqual(backup);
		expect(store.getState().backup.remoteMetadataBackupSynced).toEqual(true);
	});

	it('Backups and restores settings', async () => {
		updateSettings({
			selectedCurrency: 'GBP',
			enableOfflinePayments: false,
		});

		const backup = getSettingsStore();

		const uploadRes = await performRemoteBackup({
			slashtag,
			isSyncedKey: 'remoteSettingsBackupSynced',
			backupCategory: EBackupCategories.settings,
			backup,
		});

		if (uploadRes.isErr()) {
			throw uploadRes.error;
		}

		resetSettingsStore();
		expect(store.getState().settings.selectedCurrency).toEqual('USD');

		const restoreRes = await performSettingsRestore({
			slashtag,
		});

		if (restoreRes.isErr()) {
			throw restoreRes.error;
		}

		expect(restoreRes.value.backupExists).toEqual(true);
		expect(store.getState().settings).toEqual(backup);
		expect(store.getState().backup.remoteSettingsBackupSynced).toEqual(true);
	});

	it('Backups and restores widgets', async () => {
		setFeedWidget('url', {
			name: 'name',
			type: 'type',
			icon: 'icon',
			field: {
				name: 'name',
				main: 'main',
				files: {},
			},
		});
		updateWidgets({ onboardedWidgets: true });

		const backup = getWidgetsStore();

		const uploadRes = await performRemoteBackup({
			slashtag,
			isSyncedKey: 'remoteWidgetsBackupSynced',
			backupCategory: EBackupCategories.widgets,
			backup,
		});

		if (uploadRes.isErr()) {
			throw uploadRes.error;
		}

		resetWidgetsStore();
		expect(store.getState().widgets.widgets).toMatchObject({});

		const restoreRes = await performWidgetsRestore({
			slashtag,
		});

		if (restoreRes.isErr()) {
			throw restoreRes.error;
		}

		expect(restoreRes.value.backupExists).toEqual(true);
		expect(store.getState().widgets).toEqual(backup);
		expect(store.getState().backup.remoteWidgetsBackupSynced).toEqual(true);
	});

	it('Backups and restores LDK Activity', async () => {
		addActivityItem({
			id: 'id',
			activityType: EActivityType.lightning,
			txType: EPaymentType.received,
			txId: 'txId',
			message: '',
			address: 'invoice',
			value: 1,
			timestamp: new Date().getTime(),
		});

		const backup = getActivityStore().items.filter(
			(a) => a.activityType === EActivityType.lightning,
		);

		const uploadRes = await performRemoteBackup({
			slashtag,
			isSyncedKey: 'remoteLdkActivityBackupSynced',
			backupCategory: EBackupCategories.ldkActivity,
			backup,
		});

		if (uploadRes.isErr()) {
			throw uploadRes.error;
		}

		resetActivityStore();
		expect(store.getState().activity.items.length).toEqual(0);

		const restoreRes = await performLdkActivityRestore({
			slashtag,
		});

		if (restoreRes.isErr()) {
			throw restoreRes.error;
		}

		expect(restoreRes.value.backupExists).toEqual(true);
		expect(store.getState().activity.items).toEqual(backup);
		expect(store.getState().backup.remoteLdkActivityBackupSynced).toEqual(true);
	});

	it('Backups and restores Blocktank orders', async () => {
		const dispatch = getDispatch();
		addPaidBlocktankOrder({ orderId: 'id', txid: 'txid' });
		dispatch({
			type: actions.UPDATE_BLOCKTANK_ORDER,
			payload: defaultOrderResponse,
		});

		const { orders, paidOrders } = getBlocktankStore();
		const backup = { orders, paidOrders };

		const uploadRes = await performRemoteBackup({
			slashtag,
			isSyncedKey: 'remoteBlocktankBackupSynced',
			backupCategory: EBackupCategories.blocktank,
			backup,
		});

		if (uploadRes.isErr()) {
			throw uploadRes.error;
		}

		resetBlocktankStore();
		expect(store.getState().blocktank.orders.length).toEqual(0);
		expect(store.getState().blocktank.paidOrders).toMatchObject({});

		const restoreRes = await performBlocktankRestore({
			slashtag,
		});

		if (restoreRes.isErr()) {
			throw restoreRes.error;
		}

		expect(restoreRes.value.backupExists).toEqual(true);
		expect(store.getState().blocktank.orders).toEqual(backup.orders);
		expect(store.getState().blocktank.paidOrders).toEqual(backup.paidOrders);
		expect(store.getState().backup.remoteBlocktankBackupSynced).toEqual(true);
	});
});
