import { err, ok, Result } from '@synonymdev/result';
import { CJitStateEnum } from '@synonymdev/blocktank-lsp-http-client/dist/shared/CJitStateEnum';
import {
	BtOrderState,
	BtPaymentState,
	IBtOrder,
	ICJitEntry,
} from '@synonymdev/blocktank-lsp-http-client';

import {
	addTransfer,
	removeTransfer,
	resetSendTransaction,
	updateSendTransaction,
} from '../actions/wallet';
import { setLightningSetupStep } from '../slices/user';
import {
	getBlocktankStore,
	getWalletStore,
	dispatch,
	getFeesStore,
} from '../helpers';
import * as blocktank from '../../utils/blocktank';
import {
	createOrder,
	estimateOrderFee,
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
import { EAvailableNetwork } from '../../utils/networks';
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
import { ETransferStatus, ETransferType, TWalletName } from '../types/wallet';
import {
	addPaidBlocktankOrder,
	resetBlocktankOrders,
	updateBlocktankInfo,
	updateBlocktankOrder,
	updateCjitEntry,
} from '../slices/blocktank';
import { DEFAULT_CHANNEL_DURATION } from '../../screens/Lightning/CustomConfirm';

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
			order.state === BtOrderState.CREATED &&
			order.payment.state === BtPaymentState.PAID
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
			currentOrder?.state === order.state &&
			currentOrder?.payment.state === order.payment.state &&
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

export const getMaxChannelClientBalance = async ({
	lspBalance,
	spendingAmount,
	channelExpiryWeeks,
	lspNodeId,
	turboChannel,
}: {
	lspBalance: number;
	spendingAmount: number;
	channelExpiryWeeks: number;
	lspNodeId: string;
	turboChannel: boolean;
}): Promise<Result<number>> => {
	// 1. estimating bt order fee
	const estimateRes = await estimateOrderFee({
		lspBalanceSat: lspBalance,
		channelExpiryWeeks: channelExpiryWeeks,
		options: {
			clientBalanceSat: spendingAmount,
			couponCode: 'bitkit',
			lspNodeId,
			turboChannel,
		},
	});

	if (estimateRes.isErr()) {
		return estimateRes;
	}

	// 2. subtracting bt order fee from client balance
	const channelOpenFeeEstimate = estimateRes.value;
	let clientBalanceSat = spendingAmount - channelOpenFeeEstimate;

	// 3. estimating tx fee
	let { fast: satsPerByte } = getFeesStore().onchain;
	let transactionFeeEstimate = getTotalFee({ satsPerByte });

	// 4. subtracting tx fee from client balance
	clientBalanceSat = clientBalanceSat - transactionFeeEstimate;
	console.log('maxOrderClientBalance:', clientBalanceSat);

	return ok(clientBalanceSat);
};

/**
 * Attempts to start the purchase of a Blocktank channel.
 *
 * The function promises a Result object containing:
 * - order: The blocktank order details.
 * - channelOpenCost: The cost of opening the channel = channel user balance + fee for blocktank, aka. onchain tx sum.
 * - channelOpenFee: The fee for opening the channel, paid to blocktank.
 * - transactionFeeEstimate: An estimate of the onchain transaction fee.
 * @param {Object} params - An object containing the parameters for the function.
 * @param {number} params.clientBalanceSat - The client's balance in satoshis, aka. `remoteBalance`, `spending` on UI
 * @param {number} params.lspBalanceSat - The LSP's balance in satoshis, aka. `localBalance`, `saving` on UI
 * @param {number} [params.channelExpiry] - The expiry time of the channel.
 * @param {string} [params.lspNodeId] - The ID of the LSP node.
 * @param {string} [params.couponCode] - A coupon code for the purchase.
 * @param {boolean} [params.turboChannel] - Whether the channel is a turbo channel.
 * @param {boolean} [params.zeroConfPayment] - Whether zero confirmation payment is allowed.
 * @returns {Promise<Result<{order: IBtOrder, channelOpenCost: number, channelOpenFee: number, transactionFeeEstimate: number}>>}
 */
export const startChannelPurchase = async ({
	clientBalanceSat,
	lspBalanceSat,
	channelExpiry = DEFAULT_CHANNEL_DURATION,
	lspNodeId,
	couponCode,
	turboChannel = true,
	zeroConfPayment = false,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	clientBalanceSat: number;
	lspBalanceSat: number;
	channelExpiry?: number;
	lspNodeId?: string;
	couponCode?: string;
	turboChannel?: boolean;
	zeroConfPayment?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<
	Result<{
		order: IBtOrder;
		channelOpenCost: number;
		channelOpenFee: number;
		transactionFeeEstimate: number;
	}>
> => {
	const buyChannelResponse = await createOrder({
		lspBalanceSat,
		channelExpiryWeeks: channelExpiry,
		options: {
			clientBalanceSat,
			lspNodeId,
			couponCode,
			turboChannel,
			zeroConfPayment,
		},
	});
	if (buyChannelResponse.isErr()) {
		return err(buyChannelResponse.error.message);
	}
	const orderData = await getOrder(buyChannelResponse.value.id);
	if (orderData.isErr()) {
		showToast({
			type: 'error',
			title: i18n.t('other:bt_error_retrieve'),
			description: `An error occurred: ${orderData.error.message}`,
		});
		return err(orderData.error.message);
	}
	const order = orderData.value;

	const { onchainBalance } = getBalance({ selectedNetwork, selectedWallet });

	// Get transaction fee
	let { fast: satsPerByte } = getFeesStore().onchain;
	if (clientBalanceSat === 0) {
		// For orders with 0 client balance, we use the min 0-conf tx fee from BT to get a turbo channel.
		const min0ConfTxFee = await getMin0ConfTxFee(order.id);
		if (min0ConfTxFee.isErr()) {
			return err(min0ConfTxFee.error.message);
		}
		satsPerByte = Math.ceil(min0ConfTxFee.value.satPerVByte); // might be float
	}

	let transactionFeeEstimate = getTotalFee({ satsPerByte });
	const channelOpenCost = Math.ceil(order.feeSat);
	const orderClientBalance = Math.ceil(order.clientBalanceSat);
	const channelOpenFee = Math.abs(orderClientBalance - channelOpenCost);

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
					address: order.payment.onchain.address,
					value: channelOpenCost,
					index: 0,
				},
			],
		},
	});

	const feeRes = updateFee({ satsPerByte });
	if (feeRes.isErr()) {
		return err(feeRes.error.message);
	}
	transactionFeeEstimate = feeRes.value.fee;

	return ok({
		order,
		channelOpenCost,
		channelOpenFee,
		transactionFeeEstimate,
	});
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
}): Promise<Result<{ txid: string; useUnconfirmedInputs: boolean }>> => {
	const rawTx = await createTransaction();
	if (rawTx.isErr()) {
		showToast({
			type: 'error',
			title: i18n.t('wallet:error_create_tx'),
			description: rawTx.error.message,
		});
		return err(rawTx.error.message);
	}

	const useUnconfirmedInputs = getWalletStore().wallets[
		selectedWallet!
	].transaction[selectedNetwork!].inputs.some(({ height }) => height === 0);

	const broadcastResponse = await broadcastTransaction({
		rawTx: rawTx.value.hex,
		subscribeToOutputAddress: false,
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
	dispatch(
		addPaidBlocktankOrder({ orderId: order.id, txId: broadcastResponse.value }),
	);
	addTransfer({
		txId: broadcastResponse.value,
		type: ETransferType.open,
		status: ETransferStatus.pending,
		orderId: order.id,
		amount: order.clientBalanceSat,
	});

	// Reset tx data.
	await resetSendTransaction();

	watchOrder(order.id).then();
	dispatch(setLightningSetupStep(0));
	refreshWallet({
		onchain: true,
		lightning: false, // No need to refresh lightning wallet at this time.
		selectedWallet,
		selectedNetwork,
	}).then();

	return ok({ txid: broadcastResponse.value, useUnconfirmedInputs });
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
	if (order.channel?.state === 'opening') {
		dispatch(setLightningSetupStep(3));
	}

	// given up
	if (order.payment.bolt11Invoice.state === 'failed') {
		showToast({
			type: 'error',
			title: i18n.t('lightning:order_given_up_title'),
			description: i18n.t('lightning:order_given_up_msg'),
		});
		removeTransfer(paymentTxId);
	}

	// order expired
	if (order.state === BtOrderState.EXPIRED) {
		showToast({
			type: 'error',
			title: i18n.t('lightning:order_expired_title'),
			description: i18n.t('lightning:order_expired_msg'),
		});
		removeTransfer(paymentTxId);
	}

	// new channel open
	if (order.state === BtOrderState.OPEN) {
		// refresh LDK after channel open
		refreshLdk();
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
			// @ts-ignore
			const orderId = order?._id ? order._id : order.id;
			const getUpdatedOrderResult = await blocktank.getOrder(orderId);
			if (getUpdatedOrderResult.isErr()) {
				return;
			}
			// Update stored order
			dispatch(updateBlocktankOrder(getUpdatedOrderResult.value));
		}),
	);
	return ok('All orders refreshed.');
};
