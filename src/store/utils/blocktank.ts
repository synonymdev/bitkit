import { err, ok, Result } from '@synonymdev/result';
import { CJitStateEnum } from '@synonymdev/blocktank-lsp-http-client/dist/shared/CJitStateEnum';
import {
	BtBolt11PaymentState,
	BtOpenChannelState,
	IBtOrder,
	ICJitEntry,
} from '@synonymdev/blocktank-lsp-http-client';
import { BtOrderState2 } from '@synonymdev/blocktank-lsp-http-client/dist/shared/BtOrderState2';
import { BtPaymentState2 } from '@synonymdev/blocktank-lsp-http-client/dist/shared/BtPaymentState2';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';

import { __E2E__ } from '../../constants/env';
import { addTransfer, removeTransfer } from '../slices/wallet';
import { updateSendTransaction } from '../actions/wallet';
import { setLightningSetupStep } from '../slices/user';
import { getBlocktankStore, dispatch, getFeesStore } from '../helpers';
import * as blocktank from '../../utils/blocktank';
import {
	createOrder,
	getBlocktankInfo,
	getCJitEntry,
	getOrder,
	isGeoBlocked,
	openChannel,
	watchOrder,
} from '../../utils/blocktank';
import {
	getBalance,
	getSelectedNetwork,
	getSelectedWallet,
	refreshWallet,
} from '../../utils/wallet';
import { EAvailableNetwork } from '../../utils/networks';
import {
	broadcastTransaction,
	createTransaction,
	updateFee,
} from '../../utils/wallet/transactions';
import { showToast } from '../../utils/notifications';
import { getDisplayValues } from '../../utils/displayValues';
import i18n from '../../utils/i18n';
import { refreshLdk } from '../../utils/lightning';
import { DEFAULT_CHANNEL_DURATION } from '../../utils/wallet/constants';
import { ETransferStatus, ETransferType, TWalletName } from '../types/wallet';
import {
	addPaidBlocktankOrder,
	resetBlocktankOrders,
	updateBlocktankInfo,
	updateBlocktankOrder,
	updateCjitEntry,
} from '../slices/blocktank';

/**
 * Retrieves & updates the status of stored orders that may have changed.
 * @returns {Promise<Result<string>>}
 */
export const refreshOrdersList = async (): Promise<Result<string>> => {
	const unsettledOrders = blocktank.getPendingOrders();
	try {
		const promises = unsettledOrders.map((order) => refreshOrder(order.id));
		await Promise.all(promises);
		return ok('Orders list updated');
	} catch (e) {
		return err(e);
	}
};

/**
 * Updates the status of pending CJIT entries that may have changed.
 * @returns {Promise<Result<string>>}
 */
export const updatePendingCJitEntries = async (): Promise<Result<string>> => {
	const pendingCJitEntries = blocktank.getPendingCJitEntries();
	try {
		const promises = pendingCJitEntries.map((order) => {
			return refreshCJitEntry(order.id);
		});
		await Promise.all(promises);
		return ok('Orders list updated');
	} catch (e) {
		return err(e);
	}
};

/**
 * Retrieves and updates a given CJIT entry by orderId.
 * @param orderId
 */
export const refreshCJitEntry = async (
	orderId: string,
): Promise<Result<ICJitEntry>> => {
	try {
		const cJitEntry = await getCJitEntry(orderId);
		if (cJitEntry.state === CJitStateEnum.CREATED) {
			// Order state has not changed, no update needed.
			return ok(cJitEntry);
		}

		dispatch(updateCjitEntry(cJitEntry));

		return ok(cJitEntry);
	} catch (error) {
		return err(error);
	}
};

/**
 * Retrieves, updates and attempts to finalize any pending channel open for a given orderId.
 * @param {string} orderId
 * @returns {Promise<Result<IBtOrder>>}
 */
export const refreshOrder = async (
	orderId: string,
): Promise<Result<IBtOrder>> => {
	try {
		const currentOrders = getBlocktankStore().orders;
		const currentOrder = currentOrders.find((o) => o.id === orderId);
		const paidOrders = getBlocktankStore().paidOrders;
		const isPaidOrder = Object.keys(paidOrders).includes(orderId);

		const getOrderResult = await blocktank.getOrder(orderId);
		if (getOrderResult.isErr()) {
			return err(getOrderResult.error.message);
		}
		let order = getOrderResult.value;

		// Attempt to finalize the channel open.
		if (
			order.state2 === BtOrderState2.PAID &&
			order.payment.state2 === BtPaymentState2.PAID
		) {
			dispatch(setLightningSetupStep(1));
			const finalizeRes = await openChannel(orderId);
			if (finalizeRes.isOk()) {
				dispatch(setLightningSetupStep(3));
				const getUpdatedOrderResult = await blocktank.getOrder(orderId);
				if (getUpdatedOrderResult.isErr()) {
					return err(getUpdatedOrderResult.error.message);
				}
				order = getUpdatedOrderResult.value;
			}
		}

		// Order state has not changed
		if (
			currentOrder?.state2 === order.state2 &&
			currentOrder?.payment.state2 === order.payment.state2 &&
			currentOrder?.channel?.state === order.channel?.state
		) {
			return ok(order);
		}

		// Update stored order
		dispatch(updateBlocktankOrder(order));

		// Handle order state changes for paid orders
		if (
			currentOrder &&
			isPaidOrder &&
			(currentOrder.state2 !== order.state2 ||
				currentOrder.payment.state2 !== order.payment.state2)
		) {
			handleOrderStateChange(order);
		}

		return ok(order);
	} catch (error) {
		return err(error);
	}
};

/**
 * Retrieves and updates a given blocktank order by id.
 * @param {string} orderId
 * @returns {Promise<Result<IBtOrder>>}
 */
export const updateOrder = async (
	orderId: string,
): Promise<Result<IBtOrder>> => {
	if (!orderId) {
		return err('No orderId provided.');
	}
	const orderRes = await blocktank.getOrder(orderId);
	if (orderRes.isErr()) {
		return err(orderRes.error.message);
	}
	const order = orderRes.value;
	dispatch(updateBlocktankOrder(order));
	return ok(order);
};

/**
 * Refreshes Blocktank Node Info
 * @returns {Promise<void>}
 */
export const refreshBlocktankInfo = async (): Promise<Result<string>> => {
	const geoBlocked = await isGeoBlocked(true);
	if (geoBlocked) {
		return ok('No need to update Blocktank info.');
	}
	const infoResponse = await getBlocktankInfo();
	if (infoResponse.nodes) {
		dispatch(updateBlocktankInfo(infoResponse));
		return ok('Blocktank info updated.');
	}
	return err('Unable to update Blocktank info.');
};

/**
 * Attempts to start the purchase of a Blocktank channel.
 * @param {number} clientBalance
 * @param {number} lspBalance
 * @param {number} [channelExpiry]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const startChannelPurchase = async ({
	clientBalance,
	lspBalance,
	channelExpiryWeeks = DEFAULT_CHANNEL_DURATION,
	lspNodeId,
	source,
	turboChannel = true,
	zeroConfPayment = false,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	clientBalance: number;
	lspBalance: number;
	channelExpiryWeeks?: number;
	lspNodeId?: string;
	source?: string;
	turboChannel?: boolean;
	zeroConfPayment?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<IBtOrder>> => {
	const buyChannelResponse = await createOrder({
		lspBalance,
		channelExpiryWeeks,
		options: {
			clientBalanceSat: clientBalance,
			lspNodeId,
			source,
			turboChannel,
			zeroConfPayment,
		},
	});
	if (buyChannelResponse.isErr()) {
		return err(buyChannelResponse.error.message);
	}
	const buyChannelData = buyChannelResponse.value;

	const orderData = await getOrder(buyChannelData.id);
	if (orderData.isErr()) {
		showToast({
			type: 'warning',
			title: i18n.t('other:bt_error_retrieve'),
			description: i18n.t('other:bt_error_retrieve_msg', {
				raw: orderData.error.message,
			}),
		});
		return err(orderData.error.message);
	}

	const { onchainBalance } = getBalance({ selectedNetwork, selectedWallet });

	const amountToSend = Math.ceil(buyChannelData.feeSat);

	// Ensure we have enough funds to pay for both the channel and the fee to broadcast the transaction.
	if (amountToSend > onchainBalance) {
		// TODO: Attempt to re-calculate a lower fee channel-open that's not instant if unable to pay.
		const delta = Math.abs(amountToSend - onchainBalance);
		const cost = getDisplayValues({ satoshis: delta });
		return err(
			i18n.t('other:bt_channel_purchase_cost_error', {
				delta: `${cost.fiatSymbol}${cost.fiatFormatted}`,
			}),
		);
	}

	updateSendTransaction({
		outputs: [
			{
				address: buyChannelData.payment.onchain.address,
				value: amountToSend,
				index: 0,
			},
		],
	});

	const fees = getFeesStore().onchain;
	const feeRes = updateFee({ satsPerByte: fees.fast });
	if (feeRes.isErr()) {
		return err(feeRes.error.message);
	}

	return ok(buyChannelData);
};

/**
 * Creates, broadcasts and confirms a given Blocktank channel purchase by orderId.
 * @param {string} orderId
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @returns {Promise<Result<string>>}
 */
export const confirmChannelPurchase = async ({
	order,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	order: IBtOrder;
	selectedNetwork?: EAvailableNetwork;
	selectedWallet?: TWalletName;
}): Promise<Result<string>> => {
	const rawTx = await createTransaction();
	if (rawTx.isErr()) {
		// toast shown from createTransaction
		return err(rawTx.error.message);
	}

	const broadcastResponse = await broadcastTransaction({
		rawTx: rawTx.value.hex,
		subscribeToOutputAddress: false,
	});
	if (broadcastResponse.isErr()) {
		showToast({
			type: 'warning',
			title: i18n.t('wallet:error_broadcast_tx'),
			description: i18n.t('wallet:error_broadcast_tx', {
				raw: broadcastResponse.error.message,
			}),
		});
		return err(broadcastResponse.error.message);
	}
	dispatch(
		addPaidBlocktankOrder({ orderId: order.id, txId: broadcastResponse.value }),
	);
	dispatch(
		addTransfer({
			txId: broadcastResponse.value,
			type: ETransferType.open,
			status: ETransferStatus.pending,
			amount: order.clientBalanceSat,
			confirmsIn: 1,
			orderId: order.id,
		}),
	);

	watchOrder(order.id).then();
	dispatch(setLightningSetupStep(0));
	refreshWallet({
		onchain: true,
		lightning: false, // No need to refresh lightning wallet at this time.
		selectedWallet,
		selectedNetwork,
	}).then();

	if (!__E2E__) {
		await scheduleNotifications();
	}

	return ok('success');
};

/**
 * Dispatches various UI actions based on the state change of a given order.
 * @param {IBtOrder} order
 */
const handleOrderStateChange = (order: IBtOrder): void => {
	const paymentTxId = order.payment.onchain.transactions[0].txId;

	// queued for opening
	if (!order.channel?.state) {
		dispatch(setLightningSetupStep(2));
	}

	// opening connection
	if (order.channel?.state === BtOpenChannelState.OPENING) {
		dispatch(setLightningSetupStep(3));
	}

	// given up
	if (order.payment.bolt11Invoice.state === BtBolt11PaymentState.FAILED) {
		showToast({
			type: 'warning',
			title: i18n.t('lightning:order_given_up_title'),
			description: i18n.t('lightning:order_given_up_msg'),
		});
		dispatch(removeTransfer(paymentTxId));
	}

	// order expired
	if (order.state2 === BtOrderState2.EXPIRED) {
		showToast({
			type: 'warning',
			title: i18n.t('lightning:order_expired_title'),
			description: i18n.t('lightning:order_expired_msg'),
		});
		dispatch(removeTransfer(paymentTxId));
	}

	// new channel open
	if (order.state2 === BtOrderState2.EXECUTED) {
		// refresh LDK after channel open
		refreshLdk();

		// Cancel scheduled notifications
		notifee.cancelTriggerNotifications();
	}
};

/**
 * Wipes all stored blocktank order data and updates it to match returned data from the server.
 * Used for migrating from v1 to v2 of the Blocktank API.
 * @returns {Promise<Result<string>>}
 */
export const refreshAllBlocktankOrders = async (): Promise<Result<string>> => {
	const orders = getBlocktankStore().orders;
	dispatch(resetBlocktankOrders());
	await Promise.all(
		orders.map(async (order): Promise<void> => {
			const getUpdatedOrderResult = await blocktank.getOrder(order.id);
			if (getUpdatedOrderResult.isErr()) {
				return;
			}
			// Update stored order
			dispatch(updateBlocktankOrder(getUpdatedOrderResult.value));
		}),
	);
	return ok('All orders refreshed.');
};

export const scheduleNotifications = async (): Promise<void> => {
	// Request permissions (required for iOS)
	await notifee.requestPermission();

	// Create a channel (required for Android)
	const channelId = await notifee.createChannel({
		id: 'default',
		name: 'Default Channel',
	});

	try {
		// First notification after 24h
		const date1 = new Date(Date.now());
		date1.setHours(date1.getHours() + 24);
		const trigger1: TimestampTrigger = {
			type: TriggerType.TIMESTAMP,
			timestamp: date1.getTime(),
		};

		// Second notification after 40h
		const date2 = new Date(Date.now());
		date2.setHours(date2.getHours() + 40);
		const trigger2: TimestampTrigger = {
			type: TriggerType.TIMESTAMP,
			timestamp: date2.getTime(),
		};

		const options = {
			title: i18n.t('other:transfer_notification.title'),
			body: i18n.t('other:transfer_notification.body'),
			android: {
				channelId,
				smallIcon: 'ic_launcher_transparent',
				pressAction: { id: 'default' },
			},
		};

		// Schedule notifications
		await notifee.createTriggerNotification(options, trigger1);
		await notifee.createTriggerNotification(options, trigger2);
	} catch (e) {
		console.log(e);
	}
};
