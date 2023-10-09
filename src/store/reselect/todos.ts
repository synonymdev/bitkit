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

		// lightning
		// no open channels - inital setup
		if (openChannels.length === 0 && closedChannels.length === 0) {
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
