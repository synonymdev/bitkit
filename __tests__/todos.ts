import assert from 'node:assert';
import cloneDeep from 'lodash/cloneDeep';
import { TChannel } from '@synonymdev/react-native-ldk';
import { IBtOrder } from '@synonymdev/blocktank-lsp-http-client';

import '../src/utils/i18n';
import { todosFullSelector } from '../src/store/reselect/todos';
import store, { RootState } from '../src/store';

import { updateWallet } from '../src/store/actions/wallet';
import {
	backupSeedPhraseTodo,
	btFailedTodo,
	buyBitcoinTodo,
	lightningReadyTodo,
	lightningSettingUpTodo,
	lightningTodo,
	pinTodo,
	slashtagsProfileTodo,
	transferPendingTodo,
	transferClosingChannelTodo,
} from '../src/store/shapes/todos';
import { createNewWallet } from '../src/utils/startup';
import { EAvailableNetwork } from '../src/utils/networks';
import { ETransferStatus, ETransferType } from '../src/store/types/wallet';

describe('Todos selector', () => {
	let s: RootState;

	beforeAll(async () => {
		require('../nodejs-assets/nodejs-project/main.js');
		let res = await createNewWallet();
		if (res.isErr()) {
			throw res.error;
		}
		updateWallet({ selectedNetwork: EAvailableNetwork.bitcoinRegtest });
		s = store.getState();
	});

	it('should return default set of todos', () => {
		assert.deepEqual(todosFullSelector(s), [
			backupSeedPhraseTodo,
			lightningTodo,
			pinTodo,
			slashtagsProfileTodo,
			buyBitcoinTodo,
		]);
	});

	it('should not return pinTodo if PIN is set', () => {
		const state = cloneDeep(s);
		state.settings.pin = true;

		expect(todosFullSelector(state)).not.toEqual(
			expect.arrayContaining([pinTodo]),
		);
	});

	it('should not return backupSeedPhraseTodo if backup is verified', () => {
		const state = cloneDeep(s);
		state.user.backupVerified = true;

		expect(todosFullSelector(state)).not.toEqual(
			expect.arrayContaining([backupSeedPhraseTodo]),
		);
	});

	it('should not return slashtagsProfileTodo if profile is set', () => {
		const state = cloneDeep(s);
		state.slashtags.onboardingProfileStep = 'Done';

		expect(todosFullSelector(state)).not.toEqual(
			expect.arrayContaining([slashtagsProfileTodo]),
		);
	});

	it('should not return hidden todos', () => {
		const state = cloneDeep(s);

		const order = {
			id: 'order1',
			state: 'expired',
			// expired 10 days ago
			orderExpiresAt: new Date(
				new Date().getTime() - 10 * 24 * 60 * 60 * 1000,
			).toISOString(),
		} as IBtOrder;
		state.blocktank.paidOrders = { order1: 'txid' };
		state.blocktank.orders = [order];

		state.todos.hide = {
			backupSeedPhrase: +new Date(),
			btFailed: +new Date(),
			buyBitcoin: +new Date(),
			lightning: +new Date(),
			pin: +new Date(),
			slashtagsProfile: +new Date(),
		};

		assert.deepEqual(todosFullSelector(state), []);
	});

	it('should return lightningSettingUpTodo if there is a pending transfer to spending', () => {
		const state = cloneDeep(s);
		state.wallet.wallets.wallet0.transfers.bitcoinRegtest.push({
			txId: 'txid',
			type: ETransferType.open,
			status: ETransferStatus.pending,
			amount: 100000,
			orderId: 'order1',
		});
		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([lightningSettingUpTodo]),
		);
	});

	it('should return transferClosingChannel if there are gracefully closing channels', () => {
		const state = cloneDeep(s);

		const channel1 = {
			channel_id: 'channel1',
			is_channel_ready: true,
		} as TChannel;
		state.lightning.nodes.wallet0.channels.bitcoinRegtest = { channel1 };
		state.lightning.nodes.wallet0.openChannelIds.bitcoinRegtest = ['channel1'];
		state.user.startCoopCloseTimestamp = 123;

		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([transferClosingChannelTodo]),
		);
	});

	it('should return transferPendingTodo for addtional pending transfers to spending', () => {
		const state = cloneDeep(s);
		const channel1 = {
			channel_id: 'channel1',
			is_channel_ready: true,
		} as TChannel;
		state.lightning.nodes.wallet0.channels.bitcoinRegtest = { channel1 };
		state.lightning.nodes.wallet0.openChannelIds.bitcoinRegtest = ['channel1'];
		state.wallet.wallets.wallet0.transfers.bitcoinRegtest.push({
			txId: 'txid',
			type: ETransferType.open,
			status: ETransferStatus.pending,
			amount: 100000,
			orderId: 'order1',
		});
		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([{ ...transferPendingTodo, duration: 10 }]),
		);
	});

	it('should return transferPendingTodo if there is a transfer to savings', () => {
		const state = cloneDeep(s);
		state.wallet.wallets.wallet0.transfers.bitcoinRegtest.push({
			txId: 'txid',
			type: ETransferType.coopClose,
			status: ETransferStatus.pending,
			amount: 100000,
			confirmations: 1,
		});
		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([{ ...transferPendingTodo, duration: 50 }]),
		);
	});

	it('should return lightningReadyTodo if there is a new open channel', () => {
		const state = cloneDeep(s);

		const channel1 = {
			channel_id: 'channel1',
			is_channel_ready: true,
			confirmations: 1,
			confirmations_required: 1,
		} as TChannel;
		state.lightning.nodes.wallet0.channels.bitcoinRegtest = { channel1 };
		state.lightning.nodes.wallet0.openChannelIds.bitcoinRegtest = ['channel1'];

		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([lightningReadyTodo]),
		);
	});

	it('should return not lightningReadyTodo if notification has already been shown', () => {
		const state = cloneDeep(s);

		const channel1 = {
			channel_id: 'channel1',
			is_channel_ready: true,
			confirmations: 1,
			confirmations_required: 1,
		} as TChannel;
		state.lightning.nodes.wallet0.channels.bitcoinRegtest = { channel1 };
		state.lightning.nodes.wallet0.openChannelIds.bitcoinRegtest = ['channel1'];
		state.todos.newChannelsNotifications = { channel1: +new Date() };

		expect(todosFullSelector(state)).not.toEqual(
			expect.arrayContaining([lightningReadyTodo]),
		);
	});

	it('should return btFailedTodo if there is a failed BT order', () => {
		const state = cloneDeep(s);

		const order = {
			id: 'order1',
			state: 'expired',
			orderExpiresAt: new Date().toISOString(),
		} as IBtOrder;
		state.blocktank.paidOrders = { order1: 'txid' };
		state.blocktank.orders = [order];

		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([btFailedTodo]),
		);
	});

	it('should return btFailedTodo if there is a failed BT order and the previous one was hidden', () => {
		const state = cloneDeep(s);

		const order = {
			id: 'order1',
			state: 'expired',
			orderExpiresAt: new Date().toISOString(),
		} as IBtOrder;
		state.blocktank.paidOrders = { order1: 'txid' };
		state.blocktank.orders = [order];

		// mark btFinishedTodo as hidden
		state.todos.hide.btFailed = +new Date() - 60 * 1000;

		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([btFailedTodo]),
		);
	});
});
