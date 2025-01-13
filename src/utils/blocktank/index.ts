import {
	BlocktankClient,
	BtOrderState2,
	CJitStateEnum,
	IBt0ConfMinTxFeeWindow,
	IBtInfo,
	IBtOrder,
	ICJitEntry,
	ICreateOrderOptions,
} from '@synonymdev/blocktank-lsp-http-client';
import { IBtEstimateFeeResponse2 } from '@synonymdev/blocktank-lsp-http-client/dist/shared/IBtEstimateFeeResponse2';
import { Result, err, ok } from '@synonymdev/result';

import { __BLOCKTANK_HOST__ } from '../../constants/env';
import { dispatch, getBlocktankStore, getUserStore } from '../../store/helpers';
import { updateUser } from '../../store/slices/user';
import { ICreateOrderRequest } from '../../store/types/blocktank';
import {
	refreshAllBlocktankOrders,
	refreshOrder,
	refreshOrdersList,
} from '../../store/utils/blocktank';
import { setGeoBlock } from '../../store/utils/user';
import { DEFAULT_CHANNEL_DURATION } from '../../utils/wallet/constants';
import { sleep } from '../helpers';
import i18n from '../i18n';
import { addPeers, getNodeId, refreshLdk } from '../lightning';
import { EAvailableNetwork } from '../networks';
import { refreshWallet } from '../wallet';

const bt = new BlocktankClient();

/**
 * Sets the selectedNetwork for Blocktank.
 * @returns {void}
 */
export const setupBlocktank = async (
	selectedNetwork: EAvailableNetwork,
): Promise<void> => {
	let isGeoBlocked = false;
	switch (selectedNetwork) {
		case EAvailableNetwork.bitcoin:
			isGeoBlocked = await setGeoBlock();
			bt.baseUrl = __BLOCKTANK_HOST__;
			break;
		case EAvailableNetwork.bitcoinRegtest:
			dispatch(updateUser({ isGeoBlocked: false }));
			bt.baseUrl = 'https://api.stag0.blocktank.to/blocktank/api/v2';
			break;
	}
	if (isGeoBlocked) {
		return;
	}
	const blocktankOrders = getBlocktankStore().orders;
	// @ts-ignore
	if (blocktankOrders.length && blocktankOrders[0]?._id) {
		await refreshAllBlocktankOrders();
	}
};

/**
 * Retrieve Blocktank info from either storage or via the api.
 * @param {boolean} [fromStorage] If true, will attempt to retrieve from storage first and only fallback to the api if needed.
 * @returns {Promise<IBtInfo>}
 */
export const getBlocktankInfo = async (
	fromStorage = false,
): Promise<IBtInfo> => {
	let blocktankInfo: IBtInfo | undefined;
	if (fromStorage) {
		blocktankInfo = getBlocktankStore().info;
	}
	if (blocktankInfo?.version !== 2 || !blocktankInfo?.nodes[0]?.pubkey) {
		blocktankInfo = await bt.getInfo();
	}
	return blocktankInfo;
};

/**
 * @param {ICreateOrderRequest} data
 * @returns {Promise<Result<IBtOrder>>}
 */
export const createOrder = async ({
	lspBalance,
	channelExpiryWeeks = DEFAULT_CHANNEL_DURATION,
	options,
}: ICreateOrderRequest): Promise<Result<IBtOrder>> => {
	try {
		// Ensure we're properly connected to the Blocktank node prior to buying a channel.
		const addPeersRes = await addPeers();
		if (addPeersRes.isErr()) {
			return err(i18n.t('other:bt_error_connect'));
		}

		// Get the node ID to use for the order.
		const nodeIdResult = await getNodeId();
		if (nodeIdResult.isErr()) {
			return err(nodeIdResult.error.message);
		}
		const nodeId = nodeIdResult.value;

		const buyRes = await bt.createOrder(lspBalance, channelExpiryWeeks, {
			...options,
			nodeId,
			source: options?.source ?? 'bitkit',
			zeroReserve: true,
			announceChannel: false,
		});
		if (buyRes?.id) {
			await refreshOrder(buyRes.id);
		}
		return ok(buyRes);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * @param {ICreateOrderRequest} data
 * @returns {Promise<Result<number>>}
 */
export const estimateOrderFee = async ({
	lspBalance,
	clientBalance,
	options,
}: {
	lspBalance: number;
	clientBalance?: number;
	options?: Partial<ICreateOrderOptions>;
}): Promise<Result<IBtEstimateFeeResponse2>> => {
	try {
		const response = await bt.estimateOrderFeeFull(
			lspBalance,
			DEFAULT_CHANNEL_DURATION,
			{
				...options,
				clientBalanceSat: clientBalance,
				source: options?.source ?? 'bitkit',
				zeroReserve: true,
			},
		);
		return ok(response);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * @param {ICreateOrderRequest} data
 * @returns {Promise<Result<ICJitEntry>>}
 */
export const createCJitEntry = async ({
	channelSize,
	invoiceAmount,
	invoiceDescription,
	channelExpiryWeeks = DEFAULT_CHANNEL_DURATION,
	source = 'bitkit',
}: {
	channelSize: number;
	invoiceAmount: number;
	invoiceDescription: string;
	channelExpiryWeeks?: number;
	source?: string;
}): Promise<Result<ICJitEntry>> => {
	try {
		const nodeIdResult = await getNodeId();
		if (nodeIdResult.isErr()) {
			return err(nodeIdResult.error.message);
		}
		const nodeId = nodeIdResult.value;

		// Ensure we're properly connected to the Blocktank node prior to buying a channel.
		const addPeersRes = await addPeers();
		if (addPeersRes.isErr()) {
			return err(i18n.t('other:bt_error_connect'));
		}

		const createRes = await bt.createCJitEntry(
			channelSize,
			invoiceAmount,
			invoiceDescription,
			nodeId,
			channelExpiryWeeks,
			{ source },
		);

		return ok(createRes);
	} catch (e) {
		console.log(e);
		return err(i18n.t('wallet:receive_cjit_error_msg'));
	}
};

/**
 * Retrieves a CJIT Entry using the provided entryId.
 * @param {string} entryId
 * @returns {Promise<ICJitEntry>}
 */
export const getCJitEntry = async (entryId: string): Promise<ICJitEntry> => {
	return await bt.getCJitEntry(entryId);
};

/**
 * @param {string} orderId
 * @returns {Promise<Result<IBtOrder>>}
 */
export const getOrder = async (orderId: string): Promise<Result<IBtOrder>> => {
	try {
		const order = await bt.getOrder(orderId);
		return ok(order);
	} catch (e) {
		return err(e);
	}
};

export const getMin0ConfTxFee = async (
	orderId: string,
): Promise<Result<IBt0ConfMinTxFeeWindow>> => {
	try {
		const res = await bt.getMin0ConfTxFee(orderId);
		return ok(res);
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the data of a provided orderId from storage.
 * @param {string} orderId
 * @returns {Result<IBtOrder>}
 */
export const getOrderFromStorage = (orderId: string): Result<IBtOrder> => {
	const order = getBlocktankStore().orders.find((o) => o.id === orderId);
	if (order) {
		return ok(order);
	}
	return err('Order not found.');
};

/**
 * Attempts to finalize a pending channel open with Blocktank for the provided orderId.
 * @param {string} orderId
 * @returns {Promise<Result<IBtOrder>>}
 */
export const openChannel = async (
	orderId: string,
): Promise<Result<IBtOrder>> => {
	try {
		const nodeId = await getNodeId();
		if (nodeId.isErr()) {
			return err(nodeId.error.message);
		}
		//Attempt to sync and re-add peers prior to channel open.
		await refreshLdk();
		const finalizeChannelResponse = await bt.openChannel(orderId, nodeId.value);
		if (finalizeChannelResponse) {
			// Once finalized, refresh on-chain & lightning.
			await refreshWallet();
			return ok(finalizeChannelResponse);
		}
		return err('Unable to finalize the Blocktank channel.');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * This method will watch and update any pending Blocktank orders.
 * @returns {void}
 */
export const watchPendingOrders = (): void => {
	const { orders, paidOrders } = getBlocktankStore();
	orders
		.filter((order) => {
			return order.state2 === BtOrderState2.CREATED && order.id in paidOrders;
		})
		.forEach((order) => {
			watchOrder(order.id);
		});
};

/**
 * Return orders that have a status that may change.
 * @returns {IBtOrder[]} pending Blocktank orders
 */
export const getPendingOrders = (): IBtOrder[] => {
	const orders = getBlocktankStore().orders;
	return orders.filter((order) => {
		return [BtOrderState2.CREATED, BtOrderState2.PAID].includes(order.state2);
	});
};

/**
 * Returns CJIT orders that have been created and are currently pending.
 * @returns {ICJitEntry[]}
 */
export const getPendingCJitEntries = (): ICJitEntry[] => {
	const entries = getBlocktankStore().cJitEntries;
	return entries.filter((entry) => {
		return entry.state === CJitStateEnum.CREATED;
	});
};

const watchingOrders: string[] = [];

/**
 * Continuously checks a given order until it is finalized, the response errors out or the order expires.
 * @param {string} orderId
 * @param {number} [frequency]
 */
export const watchOrder = async (
	orderId: string,
	frequency = 15000,
): Promise<Result<string>> => {
	if (watchingOrders.includes(orderId)) {
		return err('Already watching this order.');
	}
	const orderData = getOrderFromStorage(orderId);
	if (orderData.isErr()) {
		return err(orderData.error.message);
	}
	watchingOrders.push(orderId); // Add to watchingOrders
	let settled = false;
	let error = '';
	while (!settled && !error) {
		const res = await refreshOrder(orderId);
		if (res.isErr()) {
			error = res.error.message;
			break;
		}
		if (res.value.state2 === BtOrderState2.EXPIRED) {
			error = 'Order expired.';
			break;
		}
		if (res.value.state2 === BtOrderState2.EXECUTED) {
			settled = true;
			await refreshOrdersList();
			break;
		}
		await sleep(frequency);
	}
	watchingOrders.splice(watchingOrders.indexOf(orderId), 1); // Remove from watchingOrders
	const expiry = orderData.value.orderExpiresAt;
	return ok(`Watching order (${orderId}) until it expires at ${expiry}`);
};

/**
 * Retrieve geo-block info from either storage or via the api.
 * @param {boolean} [fromStorage] If true, will attempt to retrieve from storage first and only fallback to the api if needed.
 * @returns {Promise<boolean>}
 */
export const isGeoBlocked = async (fromStorage = false): Promise<boolean> => {
	try {
		let geoBlocked: boolean | undefined;
		if (fromStorage) {
			geoBlocked = getUserStore().isGeoBlocked;
			if (geoBlocked !== undefined) {
				return geoBlocked;
			}
		}

		const response = await fetch(`${__BLOCKTANK_HOST__}/geocheck`);

		if (response.status === 403) {
			return true;
		}

		if (response.status === 200) {
			return false;
		}

		console.error(`Geo-block status check failed. [${response.status}]`);

		return false;
	} catch (error) {
		console.error(`Failed to check geo-block status. ${error}`);
		return false;
	}
};

export const logToBlocktank = async (
	nodeId: string,
	message: string,
): Promise<void> => {
	return bt.bitkitLog(nodeId, message);
};

/**
 * Returns Blocktank spending limits in sats, USD & the user's selectedCurrency.
 * CURRENTLY UNUSED
 * @param selectedCurrency
 */
// export const getSpendingLimits = ({
// 	selectedCurrency,
// }: {
// 	selectedCurrency?: string;
// }): {
// 	currentBalance: IDisplayValues;
// 	spendableBalanceSats: number;
// 	spendableBalanceFiat: number;
// 	usdSpendingLimitFiat: number;
// 	spendingLimitSats: number;
// 	selectedCurrencySpendingLimitFiat: number;
// } => {
// 	if (!selectedCurrency) {
// 		selectedCurrency = getSettingsStore().selectedCurrency;
// 	}
// 	const usdMax = 1000;
// 	const denominator = 1.2;

// 	const currentBalance = getBalance({ onchain: true });
// 	const spendableBalanceSats = Math.round(
// 		currentBalance.satoshis / denominator,
// 	);
// 	const spendableBalanceFiat = Math.round(
// 		currentBalance.fiatValue / denominator,
// 	);
// 	const usdSpendingLimitFiat =
// 		spendableBalanceFiat < usdMax ? spendableBalanceFiat : usdMax;
// 	const spendingLimitSats = fiatToBitcoinUnit({
// 		fiatValue: usdSpendingLimitFiat,
// 		bitcoinUnit: EBitcoinUnit.satoshi,
// 		currency: 'USD',
// 	});
// 	const selectedCurrencySpendingLimitFiat = getFiatDisplayValues({
// 		satoshis:
// 			spendableBalanceSats < spendingLimitSats
// 				? spendableBalanceSats
// 				: spendingLimitSats,
// 		bitcoinUnit: EBitcoinUnit.satoshi,
// 		currency: selectedCurrency,
// 	});
// 	return {
// 		currentBalance,
// 		spendableBalanceSats,
// 		spendableBalanceFiat,
// 		usdSpendingLimitFiat,
// 		spendingLimitSats,
// 		selectedCurrencySpendingLimitFiat:
// 			selectedCurrencySpendingLimitFiat.fiatValue,
// 	};
// };
