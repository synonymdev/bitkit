import { createSelector } from '@reduxjs/toolkit';
import { TChannel } from '@synonymdev/react-native-ldk';

import { RootState } from '..';
import { TTodosState } from '../types/todos';
import { ITodo } from '../types/todos';
import {
	backupSeedPhraseTodo,
	buyBitcoinTodo,
	lightningReadyTodo,
	lightningSettingUpTodo,
	lightningTodo,
	pinTodo,
	slashtagsProfileTodo,
	transferPendingTodo,
	transferClosingChannelTodo,
	btFailedTodo,
} from '../shapes/todos';
import {
	backupVerifiedSelector,
	startCoopCloseTimestampSelector,
} from './user';
import { pinSelector } from './settings';
import { onboardingProfileStepSelector } from './slashtags';
import { closedChannelsSelector, openChannelsSelector } from './lightning';
import { blocktankPaidOrdersFullSelector } from './blocktank';
import { transfersSelector } from './wallet';
import { ETransferType, TTransferToSavings } from '../types/wallet';

export const todosSelector = (state: RootState): TTodosState => state.todos;

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
	closedChannelsSelector,
	startCoopCloseTimestampSelector,
	blocktankPaidOrdersFullSelector,
	newChannelsNotificationsSelector,
	transfersSelector,
	(
		todos,
		backupVerified,
		pinTodoDone,
		onboardingStep,
		openChannels,
		closedChannels,
		startCoopCloseTimestamp,
		paidOrders,
		newChannels,
		transfers,
	): ITodo[] => {
		const { hide } = todos;

		const res: ITodo[] = [];

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

		const transferToSpending = transfers.find((t) => {
			const isOpen = t.type === ETransferType.open;
			const isPending = t.status === 'pending';
			return isOpen && isPending;
		});

		const transferToSavings = transfers.find((t) => {
			const isClose =
				t.type === ETransferType.coopClose ||
				t.type === ETransferType.forceClose;

			return isClose && t.confirmations < 6;
		});

		// lightning
		if (newChannels.length > 0) {
			// Show lightningReadyTodo if we have one channel opened recently
			res.push(lightningReadyTodo);
		} else if (showFailedBTOrder) {
			// failed blocktank order
			res.push(btFailedTodo);
		} else if (openChannels.length === 0 && closedChannels.length === 0) {
			if (transferToSpending) {
				res.push(lightningSettingUpTodo);
			} else if (transferToSavings) {
				const transfer = transferToSavings as TTransferToSavings;
				const requiredConfs = 6;
				const duration = (requiredConfs - transfer.confirmations) * 10;
				res.push({ ...transferPendingTodo, duration }); // TODO: distinguish between coop and force close
			} else if (!hide.lightning) {
				res.push(lightningTodo);
			}
		} else {
			// some channels exist
			if (startCoopCloseTimestamp > 0) {
				res.push(transferClosingChannelTodo);
			} else if (transferToSpending) {
				res.push({ ...transferPendingTodo, duration: 10 });
			} else if (transferToSavings) {
				const transfer = transferToSavings as TTransferToSavings;
				const requiredConfs = 6;
				const duration = (requiredConfs - transfer.confirmations) * 10;
				res.push({ ...transferPendingTodo, duration }); // TODO: find a way to distinguish between transfer to and from spendings
			}
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
