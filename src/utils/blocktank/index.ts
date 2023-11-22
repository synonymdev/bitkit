import {
	BlocktankClient,
	BtOrderState,
	BtPaymentState,
	IBtInfo,
	IBtOrder,
	ICJitEntry,
} from '@synonymdev/blocktank-lsp-http-client';
import { err, ok, Result } from '@synonymdev/result';
import { CJitStateEnum } from '@synonymdev/blocktank-lsp-http-client/dist/shared/CJitStateEnum';
import { BtOpenChannelState } from '@synonymdev/blocktank-lsp-http-client/dist/shared/BtOpenChannelState';

import { EAvailableNetworks, TAvailableNetworks } from '../networks';
import { addPeers, getNodeId, refreshLdk } from '../lightning';
import {
	refreshAllBlocktankOrders,
	refreshOrder,
	refreshOrdersList,
} from '../../store/actions/blocktank';
import i18n from '../../utils/i18n';
import { sleep } from '../helpers';
import { getBlocktankStore, getUserStore } from '../../store/helpers';
import {
	ICreateOrderRequest,
	TGeoBlockResponse,
} from '../../store/types/blocktank';
import { setGeoBlock, updateUser } from '../../store/actions/user';
import { refreshWallet } from '../wallet';
import { DEFAULT_CHANNEL_DURATION } from '../../screens/Lightning/CustomConfirm';
import { __BLOCKTANK_HOST__ } from '../../constants/env';

const bt = new BlocktankClient();

/**
 * Sets the selectedNetwork for Blocktank.
 * @returns {void}
 */
export const setupBlocktank = async (
	selectedNetwork: TAvailableNetworks,
): Promise<void> => {
	let isGeoBlocked = false;
	switch (selectedNetwork) {
		case EAvailableNetworks.bitcoin:
			isGeoBlocked = await setGeoBlock();
			bt.baseUrl = 'https://blocktank.synonym.to/api/v2';
			break;
		case EAvailableNetworks.bitcoinRegtest:
			updateUser({ isGeoBlocked: false });
			bt.baseUrl = 'https://api.stag.blocktank.to/blocktank/api/v2';
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
	fromStorage: boolean = false,
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
export const createOrder = async (
	data: ICreateOrderRequest,
): Promise<Result<IBtOrder>> => {
	try {
		// Ensure we're properly connected to the Blocktank node prior to buying a channel.
		const addPeersRes = await addPeers();
		if (addPeersRes.isErr()) {
			return err('Unable to add Blocktank node as a peer at this time.');
		}
		const buyRes = await bt.createOrder(
			data.lspBalanceSat,
			data.channelExpiryWeeks,
			{
				...data.options,
				couponCode: data.options?.couponCode ?? 'bitkit',
				turboChannel: true,
				zeroReserve: true,
			},
		);
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
 * @returns {Promise<Result<ICJitEntry>>}
 */
export const createCJitEntry = async ({
	channelSizeSat,
	invoiceSat,
	invoiceDescription,
	channelExpiryWeeks = DEFAULT_CHANNEL_DURATION,
	couponCode = 'bitkit',
}: {
	channelSizeSat: number;
	invoiceSat: number;
	invoiceDescription: string;
	channelExpiryWeeks: number;
	couponCode?: string;
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
			return err('Unable to add Blocktank node as a peer at this time.');
		}

		const createRes = await bt.createCJitEntry(
			channelSizeSat,
			invoiceSat,
			invoiceDescription,
			nodeId,
			channelExpiryWeeks,
			couponCode,
		);

		return ok(createRes);
	} catch (e) {
		console.log(e);
		return err(e);
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
): Promise<
	Result<{ id: string; validityEndsAt: string; satPerVByte: number }>
> => {
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
		const finalizeChannelResponse = await bt.openChannel(
			orderId,
			nodeId.value,
			false,
		);
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
	const pendingOrders = getPendingOrders();
	pendingOrders.forEach((order) => watchOrder(order.id));
};

/**
 * Return orders that have a status that may change.
 * @returns {IBtOrder[]} pending Blocktank orders
 */
export const getPendingOrders = (): IBtOrder[] => {
	const orders = getBlocktankStore().orders;
	return orders.filter((order) => {
		return [
			BtOrderState.CREATED,
			BtOrderState.OPEN,
			BtOrderState.EXPIRED,
		].includes(order.state);
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

/**
 * Continuously checks a given order until it is finalized, the response errors out or the order expires.
 * @param {string} orderId
 * @param {number} [frequency]
 */
export const watchOrder = async (
	orderId: string,
	frequency = 15000,
): Promise<Result<string>> => {
	let settled = false;
	let error: string = '';
	const orderData = getOrderFromStorage(orderId);
	if (orderData.isErr()) {
		return err(orderData.error.message);
	}
	const expiry = orderData.value.orderExpiresAt;
	while (!settled && !error) {
		const res = await refreshOrder(orderId);
		if (res.isErr()) {
			error = res.error.message;
			break;
		}
		if (res.value.state === BtOrderState.EXPIRED) {
			error = 'Order expired.';
			break;
		}
		if (res.value.state === BtOrderState.OPEN) {
			settled = true;
			await refreshOrdersList();
			break;
		}
		await sleep(frequency);
	}
	return ok(`Watching order (${orderId}) until it expires at ${expiry}`);
};

/**
 * @param {IBtOrder} order
 * @returns {string}
 */
export const getStateMessage = (order: IBtOrder): string => {
	const orderState: BtOrderState = order.state;
	const paymentState: BtPaymentState = order.payment.state;
	const channelState: BtOpenChannelState | undefined = order.channel?.state;

	switch (orderState) {
		case BtOrderState.EXPIRED:
			return i18n.t('lightning:order_state.expired');
	}

	switch (paymentState) {
		case BtPaymentState.REFUNDED:
			return i18n.t('lightning:order_state.refunded');
	}

	if (channelState) {
		switch (channelState) {
			case BtOpenChannelState.OPENING:
				return i18n.t('lightning:order_state.opening');
			case BtOpenChannelState.OPEN:
				return i18n.t('lightning:order_state.open');
			case BtOpenChannelState.CLOSED:
				return i18n.t('lightning:order_state.closed');
		}
	}

	switch (orderState) {
		case BtOrderState.CLOSED:
			return i18n.t('lightning:order_state.closed');
		case BtOrderState.OPEN:
			return i18n.t('lightning:order_state.open');
	}

	switch (paymentState) {
		case BtPaymentState.CREATED:
			return i18n.t('lightning:order_state.awaiting_payment');
		case BtPaymentState.PAID:
			return i18n.t('lightning:order_state.paid');
	}

	switch (orderState) {
		case BtOrderState.CREATED:
			return i18n.t('lightning:order_state.awaiting_payment');
	}
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
			geoBlocked = getUserStore()?.isGeoBlocked;
			if (geoBlocked !== undefined) {
				return geoBlocked;
			}
		}
		const response = await fetch(
			`${__BLOCKTANK_HOST__}/api/v2/channel/geocheck`,
		);
		const data: TGeoBlockResponse = await response.json();
		return !!data?.error;
	} catch {
		return false;
	}
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
