import { err, ok, Result } from '@synonymdev/result';
import {
	IBuyChannelRequest,
	IBuyChannelResponse,
	IGetOrderResponse,
} from '@synonymdev/blocktank-client';

import actions from './actions';
import { resetSendTransaction, updateSendTransaction } from './wallet';
import { setLightningSettingUpStep } from './user';
import { addTodo, removeTodo } from './todos';
import { getBlocktankStore, getDispatch, getFeesStore } from '../helpers';
import * as blocktank from '../../utils/blocktank';
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
	updateFee,
} from '../../utils/wallet/transactions';
import {
	finalizeChannel,
	getBlocktankInfo,
	getOrder,
	watchOrder,
} from '../../utils/blocktank';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../utils/notifications';
import { getDisplayValues } from '../../utils/displayValues';
import i18n from '../../utils/i18n';
import { setupLdk } from '../../utils/lightning';
import { TWalletName } from '../types/wallet';
import { IBlocktank } from '../types/blocktank';

const dispatch = getDispatch();

/**
 * Refreshes available services from BLocktank.
 * @returns {Promise<Result<string>>}
 */
export const refreshServiceList = async (): Promise<Result<string>> => {
	try {
		const services = await blocktank.getAvailableServices();
		if (services.isErr()) {
			return err(services.error.message);
		}

		dispatch({
			type: actions.UPDATE_BLOCKTANK_SERVICE_LIST,
			payload: services.value,
		});

		return ok('Product list updated');
	} catch (e) {
		return err(e);
	}
};

/**
 * Retrieves & updates the status of stored orders that may have changed.
 * @returns {Promise<Result<string>>}
 */
export const refreshOrdersList = async (): Promise<Result<string>> => {
	const unsettledOrders = blocktank.getPendingOrders();

	try {
		const promises = unsettledOrders.map((order) => refreshOrder(order._id));
		await Promise.all(promises);
		return ok('Orders list updated');
	} catch (e) {
		return err(e);
	}
};

/**
 * Retrieves, updates and attempts to finalize any pending channel open for a given orderId.
 * @param {string} orderId
 * @returns {Promise<Result<IGetOrderResponse>>}
 */
export const refreshOrder = async (
	orderId: string,
): Promise<Result<IGetOrderResponse>> => {
	try {
		const currentOrders = getBlocktankStore().orders;
		const currentOrder = currentOrders.find((o) => o._id === orderId);
		const paidOrders = getBlocktankStore().paidOrders;
		const isPaidOrder = Object.keys(paidOrders).includes(orderId);

		const getOrderResult = await blocktank.getOrder(orderId);
		if (getOrderResult.isErr()) {
			return err(getOrderResult.error.message);
		}
		let order = getOrderResult.value;

		// Attempt to finalize the channel open.
		if (order.state === 100) {
			setLightningSettingUpStep(1);
			const finalizeRes = await finalizeChannel(orderId);
			if (finalizeRes.isOk()) {
				removeTodo('lightning');
				const getUpdatedOrderResult = await blocktank.getOrder(orderId);
				if (getUpdatedOrderResult.isErr()) {
					return err(getUpdatedOrderResult.error.message);
				}
				order = getUpdatedOrderResult.value;
			}
		}

		// Order state has not changed
		if (currentOrder?.state === order.state) {
			return ok(order);
		}

		// Update stored order
		dispatch({
			type: actions.UPDATE_BLOCKTANK_ORDER,
			payload: order,
		});

		// Handle order state changes for paid orders
		if (currentOrder && currentOrder.state !== order.state && isPaidOrder) {
			handleOrderStateChange(order);
		}

		return ok(order);
	} catch (error) {
		return err(error);
	}
};

/**
 * Refreshes Blocktank Node Info
 * @returns {Promise<void>}
 */
export const refreshBlocktankInfo = async (): Promise<Result<string>> => {
	const infoResponse = await getBlocktankInfo();
	if (infoResponse.node_info) {
		dispatch({
			type: actions.UPDATE_BLOCKTANK_INFO,
			payload: infoResponse,
		});
		return ok('Blocktank info updated.');
	}
	return err('Unable to update Blocktank info.');
};

/**
 * Attempts to buy a channel from BLocktank and updates the saved order id information.
 * @param {IBuyChannelRequest} req
 * @returns {Promise<Result<IBuyChannelResponse>>}
 */
export const buyChannel = async (
	req: IBuyChannelRequest,
): Promise<Result<IBuyChannelResponse>> => {
	try {
		const res = await blocktank.buyChannel(req);
		if (res.isErr()) {
			return err(res.error.message);
		}

		if (res.value.order_id) {
			//Fetches and updates the user's order list
			await refreshOrder(res.value.order_id);
		} else {
			return err('Unable to find order id.');
		}

		return ok(res.value);
	} catch (error) {
		return err(error);
	}
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
	productId,
	remoteBalance,
	localBalance,
	channelExpiry = 6,
	selectedWallet,
	selectedNetwork,
}: {
	productId: string;
	remoteBalance: number;
	localBalance: number;
	channelExpiry?: number;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<{ orderId: string; channelOpenCost: number }>> => {
	if (!productId) {
		return err('Unable to retrieve Blocktank product id.');
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	const buyChannelResponse = await buyChannel({
		product_id: productId,
		remote_balance: remoteBalance,
		local_balance: localBalance,
		channel_expiry: channelExpiry,
	});
	if (buyChannelResponse.isErr()) {
		return err(buyChannelResponse.error.message);
	}
	const buyChannelData = buyChannelResponse.value;

	const orderData = await getOrder(buyChannelData.order_id);
	if (orderData.isErr()) {
		showErrorNotification({
			title: i18n.t('other:bt_error_retrieve'),
			message: orderData.error.message,
		});
		return err(orderData.error.message);
	}

	const feeEstimates = getFeesStore().onchain;
	const satsPerByte = orderData.value.zero_conf_satvbyte ?? feeEstimates.fast;
	const updateFeeRes = updateFee({
		satsPerByte: satsPerByte,
		selectedNetwork,
		selectedWallet,
	});
	if (updateFeeRes.isErr()) {
		return err(i18n.t('other:bt_channel_purchase_fee_error'));
	}

	const transactionFee = updateFeeRes.value.fee;
	const { onchainBalance } = getBalance({ selectedNetwork, selectedWallet });
	const channelOpenCost = buyChannelData.price + transactionFee;

	// Ensure we have enough funds to pay for both the channel and the fee to broadcast the transaction.
	if (buyChannelData.total_amount + transactionFee > onchainBalance) {
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
					address: buyChannelData.btc_address,
					value: buyChannelData.total_amount,
					index: 0,
				},
			],
		},
	});

	return ok({ orderId: buyChannelData.order_id, channelOpenCost });
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
		showErrorNotification({
			title: i18n.t('wallet:error_create_tx'),
			message: rawTx.error.message,
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
		showErrorNotification({
			title: i18n.t('wallet:error_broadcast_tx'),
			message: broadcastResponse.error.message,
		});
		return err(broadcastResponse.error.message);
	}
	addPaidBlocktankOrder({ orderId, txid: broadcastResponse.value });

	// Reset tx data.
	resetSendTransaction({ selectedWallet, selectedNetwork });

	watchOrder(orderId).then();
	removeTodo('lightning');
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
 * @param {IGetOrderResponse} order
 */
const handleOrderStateChange = (order: IGetOrderResponse): void => {
	// Order states: https://github.com/synonymdev/blocktank-client/blob/f8a20c35a4953435cecf8f718ee555e311e1db9b/src/services/client.ts#L15
	const currentOrders = getBlocktankStore().orders;
	const otherOrders = currentOrders.filter((o) => o._id !== order._id);
	const otherOrderStates = otherOrders.map((o) => o.state);

	const oneOtherOrderHasState = (states: number[]): boolean => {
		return otherOrderStates.some((state) => states.includes(state));
	};

	// queued for opening
	if (order.state === 200) {
		setLightningSettingUpStep(2);
	}

	// opening connection
	if (order.state === 300) {
		setLightningSettingUpStep(3);
	}

	// given up
	if (order.state === 400) {
		removeTodo('lightningSettingUp');
		showErrorNotification({
			title: i18n.t('lightning:order_given_up_title'),
			message: i18n.t('lightning:order_given_up_msg'),
		});
	}

	// order expired
	if (order.state === 410) {
		removeTodo('lightningSettingUp');
		showErrorNotification({
			title: i18n.t('lightning:order_expired_title'),
			message: i18n.t('lightning:order_expired_msg'),
		});
	}

	// channel closed
	if (order.state === 450) {
		if (!oneOtherOrderHasState([500])) {
			removeTodo('transferToSpending');
			removeTodo('transferClosingChannel');
		}
	}

	// new channel open
	if (order.state === 500) {
		removeTodo('lightningConnecting');

		if (!oneOtherOrderHasState([500])) {
			// first channel
			addTodo('lightningReady');
			setTimeout(() => removeTodo('lightningReady'), 4000);
			showSuccessNotification({
				title: i18n.t('lightning:channel_opened_title'),
				message: i18n.t('lightning:channel_opened_msg'),
			});
		} else {
			// subsequent channels
			removeTodo('transferToSpending');
		}

		// restart LDK after channel open
		setupLdk();
	}
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
