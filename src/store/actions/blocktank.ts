import { err, ok, Result } from '@synonymdev/result';

import actions from './actions';
import { resetSendTransaction, updateSendTransaction } from './wallet';
import { setLightningSettingUpStep } from './user';
import { getBlocktankStore, getDispatch } from '../helpers';
import * as blocktank from '../../utils/blocktank';
import {
	createOrder,
	getBlocktankInfo,
	getCJitEntry,
	getMin0ConfTxFee,
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
import { TAvailableNetworks } from '../../utils/networks';
import {
	broadcastTransaction,
	createTransaction,
	getTotalFee,
	updateFee,
} from '../../utils/wallet/transactions';
import { showToast } from '../../utils/notifications';
import { getDisplayValues } from '../../utils/displayValues';
import i18n from '../../utils/i18n';
import { refreshLdk } from '../../utils/lightning';
import { TWalletName } from '../types/wallet';
import { IBlocktank } from '../types/blocktank';
import {
	BtOrderState,
	BtPaymentState,
	IBtOrder,
	ICJitEntry,
} from '@synonymdev/blocktank-lsp-http-client';
import { CJitStateEnum } from '@synonymdev/blocktank-lsp-http-client/dist/shared/CJitStateEnum';

const dispatch = getDispatch();

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
export const checkPendingCJitEntries = async (): Promise<Result<string>> => {
	const pendingCJitEntries = blocktank.getPendingCJitEntries();
	try {
		const promises = pendingCJitEntries.map((order) =>
			refreshCJitEntry(order.id),
		);
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

		// Update stored CJIT entry
		dispatch({
			type: actions.UPDATE_CJIT_ENTRY,
			payload: cJitEntry,
		});

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
			order.state === BtOrderState.CREATED &&
			order.payment.state === BtPaymentState.PAID
		) {
			setLightningSettingUpStep(1);
			const finalizeRes = await openChannel(orderId);
			if (finalizeRes.isOk()) {
				setLightningSettingUpStep(3);
				const getUpdatedOrderResult = await blocktank.getOrder(orderId);
				if (getUpdatedOrderResult.isErr()) {
					return err(getUpdatedOrderResult.error.message);
				}
				order = getUpdatedOrderResult.value;
			}
		}

		// Order state has not changed
		if (
			currentOrder?.state === order.state &&
			currentOrder?.payment.state === order.payment.state &&
			currentOrder?.channel?.state === order.channel?.state
		) {
			return ok(order);
		}

		// Update stored order
		dispatch({
			type: actions.UPDATE_BLOCKTANK_ORDER,
			payload: order,
		});

		// Handle order state changes for paid orders
		if (
			currentOrder &&
			isPaidOrder &&
			(currentOrder.state !== order.state ||
				currentOrder.payment.state !== order.payment.state)
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
	dispatch({
		type: actions.UPDATE_BLOCKTANK_ORDER,
		payload: order,
	});
	return ok(order);
};

/**
 * Retrieves and updates a given blocktank order by id.
 * @param {ICJitEntry} cJitEntry
 * @returns {Promise<Result<IBtOrder>>}
 */
export const addCJitEntry = async (
	cJitEntry: ICJitEntry,
): Promise<Result<ICJitEntry>> => {
	if (!cJitEntry) {
		return err('No cJitEntry provided.');
	}
	dispatch({
		type: actions.ADD_CJIT_ENTRY,
		payload: cJitEntry,
	});
	return ok(cJitEntry);
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
		dispatch({
			type: actions.UPDATE_BLOCKTANK_INFO,
			payload: infoResponse,
		});
		return ok('Blocktank info updated.');
	}
	return err('Unable to update Blocktank info.');
};

/**
 * Attempts to start the purchase of a Blocktank channel.
 * @param {string} [productId]
 * @param {number} remoteBalance
 * @param {number} localBalance
 * @param {number} [channelExpiry]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const startChannelPurchase = async ({
	remoteBalance,
	localBalance,
	channelExpiry = 6,
	lspNodeId,
	couponCode,
	selectedWallet,
	selectedNetwork,
}: {
	remoteBalance: number;
	localBalance: number;
	channelExpiry?: number;
	lspNodeId?: string;
	couponCode?: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<
	Result<{
		order: IBtOrder;
		channelOpenCost: number;
		channelOpenFee: number;
		transactionFeeEstimate: number;
	}>
> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	const buyChannelResponse = await createOrder({
		lspBalanceSat: localBalance,
		channelExpiryWeeks: channelExpiry,
		options: {
			clientBalanceSat: remoteBalance,
			lspNodeId,
			couponCode,
		},
	});
	if (buyChannelResponse.isErr()) {
		return err(buyChannelResponse.error.message);
	}
	const buyChannelData = buyChannelResponse.value;

	const orderData = await getOrder(buyChannelData.id);
	if (orderData.isErr()) {
		showToast({
			type: 'error',
			title: i18n.t('other:bt_error_retrieve'),
			description: `An error occurred: ${orderData.error.message}`,
		});
		return err(orderData.error.message);
	}

	const { onchainBalance } = getBalance({ selectedNetwork, selectedWallet });
	const min0ConfTxFee = await getMin0ConfTxFee(orderData.value.id);
	if (min0ConfTxFee.isErr()) {
		return err(min0ConfTxFee.error.message);
	}
	let txFeeInSats = getTotalFee({
		satsPerByte: min0ConfTxFee.value.satPerVByte + 1,
		selectedWallet,
		selectedNetwork,
	});
	const channelOpenCost = buyChannelData.feeSat;
	const channelOpenFee = Math.abs(
		buyChannelData.clientBalanceSat - buyChannelData.feeSat,
	);
	// Ensure we have enough funds to pay for both the channel and the fee to broadcast the transaction.
	if (channelOpenCost > onchainBalance) {
		// TODO: Attempt to re-calculate a lower fee channel-open that's not instant if unable to pay.
		const delta = Math.abs(channelOpenCost - onchainBalance);
		const cost = getDisplayValues({ satoshis: delta });
		return err(
			i18n.t('other:bt_channel_purchase_cost_error', {
				delta: `${cost.fiatSymbol}${cost.fiatFormatted}`,
			}),
		);
	}

	updateSendTransaction({
		transaction: {
			outputs: [
				{
					address: buyChannelData.payment.onchain.address,
					value: buyChannelData.feeSat,
					index: 0,
				},
			],
		},
	});

	const feeRes = updateFee({
		satsPerByte: min0ConfTxFee.value.satPerVByte + 1,
		selectedWallet,
		selectedNetwork,
	});
	if (feeRes.isOk()) {
		txFeeInSats = feeRes.value.fee;
	}

	return ok({
		order: buyChannelData,
		channelOpenCost,
		channelOpenFee,
		transactionFeeEstimate: txFeeInSats,
	});
};

/**
 * Creates, broadcasts and confirms a given Blocktank channel purchase by orderId.
 * @param {string} orderId
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @returns {Promise<Result<string>>}
 */
export const confirmChannelPurchase = async ({
	orderId,
	selectedNetwork,
	selectedWallet,
}: {
	orderId: string;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	const rawTx = await createTransaction({ selectedWallet, selectedNetwork });
	if (rawTx.isErr()) {
		showToast({
			type: 'error',
			title: i18n.t('wallet:error_create_tx'),
			description: rawTx.error.message,
		});
		return err(rawTx.error.message);
	}
	const broadcastResponse = await broadcastTransaction({
		rawTx: rawTx.value.hex,
		subscribeToOutputAddress: false,
		selectedWallet,
		selectedNetwork,
	});
	if (broadcastResponse.isErr()) {
		showToast({
			type: 'error',
			title: i18n.t('wallet:error_broadcast_tx'),
			description: broadcastResponse.error.message,
		});
		return err(broadcastResponse.error.message);
	}
	addPaidBlocktankOrder({ orderId, txid: broadcastResponse.value });

	// Reset tx data.
	resetSendTransaction({ selectedWallet, selectedNetwork });

	watchOrder(orderId).then();
	setLightningSettingUpStep(0);
	refreshWallet({
		onchain: true,
		lightning: false, // No need to refresh lightning wallet at this time.
		selectedWallet,
		selectedNetwork,
	}).then();

	return ok(broadcastResponse.value);
};

/**
 * Stores all paid order id's and pairs them with their corresponding txid.
 * @param {string} orderId
 * @param {string} txid
 */
export const addPaidBlocktankOrder = ({
	orderId,
	txid,
}: {
	orderId: string;
	txid: string;
}): void => {
	const payload = {
		orderId,
		txid,
	};
	dispatch({
		type: actions.ADD_PAID_BLOCKTANK_ORDER,
		payload,
	});
};

/**
 * Dispatches various UI actions based on the state change of a given order.
 * @param {IBtOrder} order
 */
const handleOrderStateChange = (order: IBtOrder): void => {
	// queued for opening
	if (!order.channel?.state) {
		setLightningSettingUpStep(2);
	}

	// opening connection
	if (order.channel?.state === 'opening') {
		setLightningSettingUpStep(3);
	}

	// given up
	if (order.payment.bolt11Invoice.state === 'failed') {
		showToast({
			type: 'error',
			title: i18n.t('lightning:order_given_up_title'),
			description: i18n.t('lightning:order_given_up_msg'),
		});
	}

	// order expired
	if (order.state === BtOrderState.EXPIRED) {
		showToast({
			type: 'error',
			title: i18n.t('lightning:order_expired_title'),
			description: i18n.t('lightning:order_expired_msg'),
		});
	}

	// new channel open
	if (order.state === BtOrderState.OPEN) {
		// refresh LDK after channel open
		refreshLdk({});
	}
};

/**
 * Wipes all stored blocktank orders.
 * @returns {<Result<string>>}
 */
export const resetBlocktankOrders = (): Result<string> => {
	dispatch({ type: actions.RESET_BLOCKTANK_ORDERS });
	return ok('');
};

/**
 * Wipes all stored blocktank order data and updates it to match returned data from the server.
 * Used for migrating from v1 to v2 of the Blocktank API.
 * @returns {Promise<Result<string>>}
 */
export const refreshAllBlocktankOrders = async (): Promise<Result<string>> => {
	const orders = getBlocktankStore().orders;
	await resetBlocktankOrders();
	await Promise.all(
		orders.map(async (order): Promise<void> => {
			// @ts-ignore
			const orderId = order?._id ? order._id : order.id;
			const getUpdatedOrderResult = await blocktank.getOrder(orderId);
			if (getUpdatedOrderResult.isErr()) {
				return;
			}
			const payload = getUpdatedOrderResult.value;
			// Update stored order
			dispatch({
				type: actions.UPDATE_BLOCKTANK_ORDER,
				payload,
			});
		}),
	);
	return ok('All orders refreshed.');
};

export const updateBlocktank = (
	payload: Partial<IBlocktank>,
): Result<string> => {
	dispatch({
		type: actions.UPDATE_BLOCKTANK,
		payload,
	});
	return ok('');
};

/*
 * This resets the activity store to defaultActivityShape
 * @returns {Result<string>}
 */
export const resetBlocktankStore = (): Result<string> => {
	dispatch({ type: actions.RESET_BLOCKTANK_STORE });
	return ok('');
};
