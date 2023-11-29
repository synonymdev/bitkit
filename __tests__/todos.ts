import assert from 'node:assert';
import cloneDeep from 'lodash/cloneDeep';
import { TChannel } from '@synonymdev/react-native-ldk';
import { IBtOrder } from '@synonymdev/blocktank-lsp-http-client';

import '../src/utils/i18n';
import { todosFullSelector } from '../src/store/reselect/todos';
import store from '../src/store';
import Store from '../src/store/types';
import { updateWallet } from '../src/store/actions/wallet';
import {
	backupSeedPhraseTodo,
	buyBitcoinTodo,
	lightningConnectingTodo,
	lightningReadyTodo,
	lightningSettingUpTodo,
	lightningTodo,
	pinTodo,
	slashtagsProfileTodo,
	transferClosingChannel,
	transferToSavingsTodo,
	transferToSpendingTodo,
} from '../src/store/shapes/todos';
import { createNewWallet } from '../src/utils/startup';

describe('Todos selector', () => {
	let s: Store;

	beforeAll(async () => {
		require('../nodejs-assets/nodejs-project/main.js');
		let res = await createNewWallet();
		if (res.isErr()) {
			throw res.error;
		}
		updateWallet({ selectedNetwork: 'bitcoinRegtest' });
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
		state.todos.hide = {
			backupSeedPhrase: +new Date(),
			pin: +new Date(),
			slashtagsProfile: +new Date(),
			buyBitcoin: +new Date(),
			lightning: +new Date(),
		};

		assert.deepEqual(todosFullSelector(state), []);
	});

	it('should return lightningSettingUpTodo if there is a pending BT order', () => {
		const state = cloneDeep(s);
		state.blocktank.orders.push({
			id: 'order1',
			state: 'created',
		} as IBtOrder);
		state.blocktank.paidOrders = { order1: 'txid' };

		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([lightningSettingUpTodo]),
		);
	});

	it('should return lightningConnectingTodo if there is a pending channel', () => {
		const state = cloneDeep(s);

		const channel1 = {
			channel_id: 'channel1',
			is_channel_ready: false,
		} as TChannel;
		state.lightning.nodes.wallet0.channels.bitcoinRegtest = { channel1 };
		state.lightning.nodes.wallet0.openChannelIds.bitcoinRegtest = ['channel1'];

		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([lightningConnectingTodo]),
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
			expect.arrayContaining([transferClosingChannel]),
		);
	});

	it('should return transferToSpendingTodo if there are new pending BT orders', () => {
		const state = cloneDeep(s);

		const channel1 = {
			channel_id: 'channel1',
			is_channel_ready: true,
		} as TChannel;
		state.lightning.nodes.wallet0.channels.bitcoinRegtest = { channel1 };
		state.lightning.nodes.wallet0.openChannelIds.bitcoinRegtest = ['channel1'];
		state.blocktank.orders.push({ id: 'order1', state: 'created' } as IBtOrder);
		state.blocktank.paidOrders = { order1: 'txid' };

		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([transferToSpendingTodo]),
		);
	});

	it('should return transferToSavingsTodo if there is a new claimable balance', () => {
		const state = cloneDeep(s);

		const channel1 = {
			channel_id: 'channel1',
			is_channel_ready: true,
		} as TChannel;
		state.lightning.nodes.wallet0.channels.bitcoinRegtest = { channel1 };
		state.lightning.nodes.wallet0.openChannelIds.bitcoinRegtest = ['channel1'];
		state.lightning.nodes.wallet0.claimableBalance.bitcoinRegtest = 123;

		expect(todosFullSelector(state)).toEqual(
			expect.arrayContaining([transferToSavingsTodo]),
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
});
