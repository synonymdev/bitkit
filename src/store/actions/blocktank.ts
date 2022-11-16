import actions from './actions';
import { err, ok, Result } from '@synonymdev/result';
import { getDispatch, getStore } from '../helpers';
import {
	IBuyChannelRequest,
	IBuyChannelResponse,
	IFinalizeChannelResponse,
	IGetOrderResponse,
} from '@synonymdev/blocktank-client';
import * as blocktank from '../../utils/blocktank';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
	updateBitcoinTransaction,
} from './wallet';
import {
	getBalance,
	getSelectedNetwork,
	getSelectedWallet,
	refreshWallet,
} from '../../utils/wallet';
import { EAvailableNetworks, TAvailableNetworks } from '../../utils/networks';
import { sleep } from '../../utils/helpers';
import {
	broadcastTransaction,
	createTransaction,
	getOnchainTransactionData,
	updateFee,
} from '../../utils/wallet/transactions';
import { getNodeId } from '../../utils/lightning';
import {
	finalizeChannel,
	getBlocktankInfo,
	getOrder,
	watchOrder,
} from '../../utils/blocktank';
import { addTodo, removeTodo } from './todos';
import { showErrorNotification } from '../../utils/notifications';
import { getDisplayValues } from '../../utils/exchange-rate';

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
 * Retrieves & Updates the status of all stored orders.
 * @returns {Promise<Result<string>>}
 */
export const refreshOrdersList = async (): Promise<Result<string>> => {
	try {
		const orders = getStore().blocktank.orders;
		let ordersThatNeedUpdating: string[] = [];
		await Promise.all(
			orders.map((order) => {
				if (order.state < 410) {
					ordersThatNeedUpdating.push(order._id);
				}
			}),
		);
		await Promise.all(
			ordersThatNeedUpdating.map(async (orderId) => {
				await refreshOrder(orderId);
			}),
		);
		return ok('Orders list updated');
	} catch (e) {
		return err(e);
	}
};

/**
 * Retrieves, updates and attempts to finalize any pending channel open for a given orderId.
 * @param {string} orderId
 * @param {IGetOrderResponse} [orderResponse]
 * @returns {Promise<Result<IGetOrderResponse>>}
 */
export const refreshOrder = async (
	orderId: string,
	orderResponse?: IGetOrderResponse,
): Promise<Result<IGetOrderResponse>> => {
	try {
		if (!orderResponse) {
			const getOrderRes = await blocktank.getOrder(orderId);
			if (getOrderRes.isErr()) {
				return err(getOrderRes.error.message);
			}
			orderResponse = getOrderRes.value;

			// Attempt to finalize the channel open.
			if (getOrderRes.value.state === 100) {
				const finalizeRes = await finalizeChannel(orderId);
				if (finalizeRes.isOk()) {
					removeTodo('lightning');
					removeTodo('lightningSettingUp');
					addTodo('transfer');
					const getUpdatedOrderRes = await blocktank.getOrder(orderId);
					if (getUpdatedOrderRes.isErr()) {
						return err(getUpdatedOrderRes.error.message);
					}
					orderResponse = getUpdatedOrderRes.value;
				}
			}
		}

		const storedOrder = getStore().blocktank.orders.filter(
			(o) =>
				o._id === orderId || (orderResponse && orderResponse._id === o._id),
		);
		if (
			storedOrder.length > 0 &&
			storedOrder[0].state === orderResponse.state
		) {
			return ok(orderResponse);
		}

		dispatch({
			type: actions.UPDATE_BLOCKTANK_ORDER,
			payload: orderResponse,
		});

		return ok(orderResponse);
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
	if (infoResponse && infoResponse?.node_info) {
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

		if (res.value?.order_id) {
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

/*
 * This resets the activity store to defaultActivityShape
 * @returns {Result<string>}
 */
export const resetBlocktankStore = (): Result<string> => {
	dispatch({
		type: actions.RESET_BLOCKTANK_STORE,
	});
	return ok('');
};

// TODO: This is for DEV testing purposes on regtest only. Remove upon release.
/**
 * Attempts to auto-buy a channel from Blocktank while on regtest.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [selectedWallet]
 * @param {number} [inboundLiquidity]
 * @param {number} [outboundLiquidity]
 * @param {number} [channelExpiry]
 * @returns {Promise<Result<IFinalizeChannelResponse>>}
 */
export const autoBuyChannel = async ({
	selectedNetwork,
	selectedWallet,
	inboundLiquidity = 100000, //Inbound liquidity. How much will be on Blocktank.
	outboundLiquidity = 0, //Outbound liquidity. How much will get pushed to the app
	channelExpiry = 12,
}: {
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: string;
	inboundLiquidity?: number;
	outboundLiquidity?: number;
	channelExpiry?: number;
}): Promise<Result<IFinalizeChannelResponse>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (selectedNetwork !== EAvailableNetworks.bitcoinRegtest) {
		return err('This method is only allowed on regtest.');
	}
	const nodeId = await getNodeId();
	console.log('Nodeid', nodeId);
	if (nodeId.isErr()) {
		return err(nodeId.error.message);
	}

	const { satoshis } = getBalance({
		onchain: true,
		selectedNetwork,
		selectedWallet,
	});
	if (!satoshis || satoshis < 2000) {
		return err('Please send at least 2000 satoshis to your wallet.');
	}
	const product_id = getStore().blocktank.serviceList[0].product_id;
	console.log('Product ID:', product_id);
	/*const remote_balance =
		getStore().blocktank.serviceList[0].min_channel_size * 4;
	const local_balance =
		getStore().blocktank.serviceList[0].min_channel_size * 4;*/
	const buyChannelData = {
		product_id,
		remote_balance: outboundLiquidity,
		local_balance: inboundLiquidity,
		channel_expiry: channelExpiry,
	};
	const buyChannelResponse = await buyChannel(buyChannelData);
	console.log('buyChannelResponse:', buyChannelResponse);
	if (buyChannelResponse.isErr()) {
		return err(buyChannelResponse.error.message);
	}
	await setupOnChainTransaction({
		rbf: false,
		selectedNetwork,
		selectedWallet,
	});
	await updateBitcoinTransaction({
		transaction: {
			outputs: [
				{
					value: buyChannelResponse.value.price,
					index: 0,
					address: buyChannelResponse.value.btc_address,
				},
			],
		},
		selectedNetwork,
		selectedWallet,
	});
	await updateFee({ satsPerByte: 4, selectedNetwork, selectedWallet });
	console.log('Creating Transaction...');
	const rawTx = await createTransaction({ selectedNetwork, selectedWallet });
	console.log('rawTx:', rawTx);
	if (rawTx.isErr()) {
		return err(rawTx.error.message);
	}
	console.log('Broadcastion Transaction...');
	const broadcastResponse = await broadcastTransaction({
		rawTx: rawTx.value.hex,
		selectedNetwork,
		selectedWallet,
	});
	console.log('broadcastResponse: ', broadcastResponse);
	if (broadcastResponse.isErr()) {
		return err(broadcastResponse.error.message);
	}
	let paymentReceived = false;
	let i = 1;
	while (!paymentReceived && i <= 60) {
		const orderStatus = await blocktank.getOrder(
			buyChannelResponse.value.order_id,
		);
		console.log(`orderStatus check (${i}/60): `, orderStatus);
		if (orderStatus.isErr()) {
			return err(orderStatus.error.message);
		}
		if (orderStatus.value.state === 100) {
			paymentReceived = true;
		}
		await sleep(5000);
		i++;
	}
	if (!paymentReceived) {
		console.log('Payment not received.');
		return err('Payment not received.');
	}

	const finalizeResponse = await blocktank.finalizeChannel(
		buyChannelResponse.value.order_id,
	);
	console.log('finalizeResponse', finalizeResponse);
	return finalizeResponse;
};

/**
 * Attempts to start the purchase of a Blocktank channel.
 * @param {string} [productId]
 * @param {number} remoteBalance
 * @param {number} localBalance
 * @param {number} [channelExpiry]
 * @param {string} [selectedWallet]
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
	productId?: string;
	remoteBalance: number;
	localBalance: number;
	channelExpiry?: number;
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	if (!productId) {
		return err('Unable to retrieve Blocktank product id.');
	}

	const buyChannelData = {
		product_id: productId,
		remote_balance: remoteBalance,
		local_balance: localBalance,
		channel_expiry: channelExpiry,
	};
	const buyChannelResponse = await buyChannel(buyChannelData);
	if (buyChannelResponse.isErr()) {
		return err(buyChannelResponse.error.message);
	}

	const orderData = await getOrder(buyChannelResponse.value.order_id);
	if (orderData.isErr()) {
		showErrorNotification({
			title: 'Unable To Retrieve Order Information.',
			message: orderData.error.message,
		});
		return err(orderData.error.message);
	}

	await updateBitcoinTransaction({
		transaction: {
			rbf: false,
			outputs: [
				{
					value: buyChannelResponse.value.total_amount,
					index: 0,
					address: buyChannelResponse.value.btc_address,
				},
			],
		},
	});

	// Set fee appropriately to open an instant channel.
	const zero_conf_satvbyte = orderData.value.zero_conf_satvbyte;
	await updateFee({ satsPerByte: zero_conf_satvbyte, selectedNetwork });

	const transactionDataRes = getOnchainTransactionData({
		selectedWallet,
		selectedNetwork,
	});
	if (transactionDataRes.isErr()) {
		return err(transactionDataRes.error.message);
	}
	const transaction = transactionDataRes.value;
	const currentBalance = getBalance({
		onchain: true,
		selectedNetwork,
		selectedWallet,
	});

	// Ensure we have enough funds to pay for both the channel and the fee to broadcast the transaction.
	if (
		(transaction?.fee ?? 0) + (buyChannelResponse.value?.total_amount ?? 0) >
		currentBalance.satoshis
	) {
		// TODO: Attempt to re-calculate a lower fee channel-open that's not instant if unable to pay.
		const delta = Math.abs(
			(transaction?.fee ?? 0) +
				(buyChannelResponse.value?.price ?? 0) -
				currentBalance.satoshis,
		);
		const cost = getDisplayValues({
			satoshis: delta,
		});
		return err(
			`You need ${
				cost.fiatSymbol + cost.fiatFormatted
			} more to complete this transaction.`,
		);
	}

	return ok(buyChannelResponse.value.order_id);
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
 * Creates, broadcasts and confirms a given Blocktank channel purchase by orderId.
 * @param {string} orderId
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const confirmChannelPurchase = async ({
	orderId,
	selectedNetwork,
}: {
	orderId: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const rawTx = await createTransaction({ selectedNetwork });
	if (rawTx.isErr()) {
		showErrorNotification({
			title: 'Unable To Create Transaction',
			message: rawTx.error.message,
		});
		return err(rawTx.error.message);
	}
	const broadcastResponse = await broadcastTransaction({
		rawTx: rawTx.value.hex,
		selectedNetwork,
		subscribeToOutputAddress: false,
	});
	if (broadcastResponse.isErr()) {
		showErrorNotification({
			title: 'Unable To Broadcast Transaction',
			message: broadcastResponse.error.message,
		});
		return err(broadcastResponse.error.message);
	}
	addPaidBlocktankOrder({ orderId, txid: broadcastResponse.value });

	// Reset tx data.
	resetOnChainTransaction({ selectedNetwork });

	watchOrder(orderId).then();
	removeTodo('lightning');
	addTodo('lightningSettingUp');
	refreshWallet({ onchain: true, lightning: false }).then();
	return ok(broadcastResponse.value);
};
