import { createSelector } from '@reduxjs/toolkit';
import { TChannel } from '@synonymdev/react-native-ldk';

import Store from '../types';
import { ITodos } from '../types/todos';
import { ITodo } from '../types/todos';
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
	btFailedTodo,
} from '../shapes/todos';
import {
	backupVerifiedSelector,
	startCoopCloseTimestampSelector,
} from './user';
import { pinSelector } from './settings';
import { onboardingProfileStepSelector } from './slashtags';
import {
	claimableBalanceSelector,
	closedChannelsSelector,
	openChannelsSelector,
	pendingChannelsSelector,
} from './lightning';
import { blocktankPaidOrdersFullSelector } from './blocktank';

export const todosSelector = (state: Store): ITodos => state.todos;

export const newChannelsNotificationsSelector = createSelector(
	todosSelector,
	openChannelsSelector,
	(todos, openChannels): TChannel[] => {
		const { newChannelsNotifications } = todos;
		const newChannels = openChannels.filter((c) => {
			return (
				c.confirmations <= (c.confirmations_required ?? 1) &&
				!newChannelsNotifications[c.channel_id]
			);
		});
		return newChannels;
	},
);

export const todosFullSelector = createSelector(
	todosSelector,
	backupVerifiedSelector,
	pinSelector,
	onboardingProfileStepSelector,
	openChannelsSelector,
	pendingChannelsSelector,
	closedChannelsSelector,
	startCoopCloseTimestampSelector,
	claimableBalanceSelector,
	blocktankPaidOrdersFullSelector,
	newChannelsNotificationsSelector,
	(
		todos,
		backupVerified,
		pinTodoDone,
		onboardingStep,
		openChannels,
		pendingChannels,
		closedChannels,
		startCoopCloseTimestamp,
		claimableBalance,
		paidOrders,
		newChannels,
	): Array<ITodo> => {
		const { hide } = todos;

		const res: Array<ITodo> = [];

		if (!hide.backupSeedPhrase && !backupVerified) {
			res.push(backupSeedPhraseTodo);
		}

		const showFailedBTOrder = paidOrders.expired.some((order) => {
			// ignore orders older than 1 week
			if (
				Date.now() - Number(new Date(order.orderExpiresAt)) >
				7 * 24 * 60 * 60 * 1000
			) {
				return false;
			}

			if (!hide.btFailed) {
				return true;
			}

			return Number(new Date(order.orderExpiresAt)) > hide.btFailed;
		});

		// lightning
		if (showFailedBTOrder) {
			// failed blocktank order
			res.push(btFailedTodo);
		} else if (openChannels.length === 0 && closedChannels.length === 0) {
			// no open channels - inital setup
			if (pendingChannels.length > 0) {
				res.push(lightningConnectingTodo);
			} else if (Object.keys(paidOrders.created).length > 0) {
				res.push(lightningSettingUpTodo);
			} else if (claimableBalance > 0) {
				res.push(transferToSavingsTodo); // TODO: find a way to distinguish between transfer to and from spendings
			} else if (!hide.lightning) {
				res.push(lightningTodo);
			}
		} else {
			// some channels exist
			if (startCoopCloseTimestamp > 0) {
				res.push(transferClosingChannel);
			} else if (Object.keys(paidOrders.created).length > 0) {
				res.push(transferToSpendingTodo);
			} else if (claimableBalance > 0) {
				res.push(transferToSavingsTodo); // TODO: find a way to distinguish between transfer to and from spendings
			}
		}

		// Show lightningReadyTodo if we have one channel opened recently
		if (newChannels.length > 0) {
			res.push(lightningReadyTodo);
		}

		if (!hide.pin && !pinTodoDone) {
			res.push(pinTodo);
		}

		if (!hide.slashtagsProfile && onboardingStep !== 'Done') {
			res.push(slashtagsProfileTodo);
		}

		if (!hide.buyBitcoin) {
			res.push(buyBitcoinTodo);
		}

		return res;
	},
);
