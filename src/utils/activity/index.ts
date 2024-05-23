import { err, ok, Result } from '@synonymdev/result';
import { EPaymentType, IFormattedTransaction } from 'beignet';

import { btcToSats } from '../conversion';
import i18n, { i18nTime } from '../../utils/i18n';
import { getTransferForTx } from '../wallet/transfer';
import { getActivityStore } from '../../store/helpers';
import {
	EActivityType,
	IActivityItem,
	TOnchainActivityItem,
} from '../../store/types/activity';

/**
 * Converts a formatted transaction to an activity item
 * @param {IFormattedTransaction} transaction
 * @returns {TOnchainActivityItem} activityItem
 */
export const onChainTransactionToActivityItem = async ({
	transaction,
}: {
	transaction: IFormattedTransaction;
}): Promise<TOnchainActivityItem> => {
	const transfer = await getTransferForTx(transaction);

	// subtract fee from amount if applicable
	const amount =
		transaction.type === 'sent'
			? transaction.value + transaction.fee
			: transaction.value;

	return {
		id: transfer ? transfer.txId : transaction.txid,
		exists: transaction?.exists ?? true,
		activityType: EActivityType.onchain,
		txType: transaction.type,
		txId: transaction.txid,
		value: btcToSats(Math.abs(amount)),
		fee: btcToSats(Math.abs(transaction.fee)),
		feeRate: Math.round(transaction.satsPerByte),
		address: transaction.address,
		confirmed: transaction.height > 0,
		isBoosted: false,
		isTransfer: !!transfer,
		timestamp: transaction.timestamp,
		confirmTimestamp: transaction.confirmTimestamp,
	};
};

/**
 * Retrieves an activity item by its id.
 * @param {string} id
 * @returns Result<IActivityItem>
 */
export const getActivityItemById = (id: string): Result<IActivityItem> => {
	const activities = getActivityStore().items;
	const activity = activities.find((item) => item.id === id);
	if (!activity) {
		return err('Activity item not found');
	}
	return ok(activity);
};

/**
 * Appends any new activity items while leaving known ones
 * @param {IActivityItem[]} oldItems
 * @param {IActivityItem[]} newItems
 * @returns {IActivityItem[]}
 */
export const mergeActivityItems = (
	oldItems: IActivityItem[],
	newItems: IActivityItem[],
): IActivityItem[] => {
	const newItemIds = new Map(
		newItems.map((item) => [`${item.activityType}${item.id}`, item]),
	);
	const reduced = oldItems.filter(
		(item) => !newItemIds.has(`${item.activityType}${item.id}`),
	);
	const mergedItems = reduced.concat(newItems);

	// Check if sorting is necessary (This is faster than performing the sort every time)
	let needsSorting = false;
	for (let i = 1; i < mergedItems.length; i++) {
		if (mergedItems[i].timestamp > mergedItems[i - 1].timestamp) {
			needsSorting = true;
			break;
		}
		if (
			mergedItems[i].timestamp === mergedItems[i - 1].timestamp &&
			mergedItems[i].txType === 'sent'
		) {
			needsSorting = true;
			break;
		}
	}

	if (!needsSorting) {
		return mergedItems;
	}

	// 'Received' should be before 'Sent' if they have same timestamp
	const sortOrder = ['received', 'sent'];
	const sortedItems = mergedItems.sort(
		(a, b) =>
			b.timestamp - a.timestamp ||
			sortOrder.indexOf(b.txType) - sortOrder.indexOf(a.txType),
	);

	return sortedItems;
};

export type TActivityFilter = {
	search?: string;
	types?: EActivityType[];
	tags?: string[];
	txType?: EPaymentType;
	includeTransfers?: boolean;
	onlyTransfers?: boolean;
	timerange?: number[];
};

/**
 * Filters activity items based on search string, type list or tags
 * @param {IActivityItem[]} items
 * @param {{ [txid: string]: string[] }} metaTags
 * @param {TActivityFilter} filter
 */
export const filterActivityItems = (
	items: IActivityItem[],
	metaTags: { [txid: string]: string[] },
	{
		search = '',
		types = [],
		includeTransfers = false,
		onlyTransfers = false,
		tags = [],
		txType,
		timerange = [],
	}: TActivityFilter,
): IActivityItem[] => {
	const lowerSearch = search.toLowerCase();

	return items.filter((item) => {
		const isOnchain = item.activityType === EActivityType.onchain;
		const isLightning = item.activityType === EActivityType.lightning;

		// If there is a search set and it's not found in the message, txid, address or value
		// then don't bother continuing
		if (
			search &&
			!(
				(isLightning && item.message.toLowerCase().includes(lowerSearch)) ||
				item.id.toLowerCase().includes(lowerSearch) ||
				((isOnchain || isLightning) &&
					item.address.toLowerCase().includes(lowerSearch)) ||
				item.value.toString().includes(lowerSearch)
			)
		) {
			return false;
		}

		// type doesn't match
		if (types.length > 0 && !types.includes(item.activityType)) {
			return false;
		}

		// If we're not including transfers and it's a transfer, skip it
		// @ts-ignore
		if (!includeTransfers && item.isTransfer) {
			return false;
		}

		// If we're only including transfers and it's not a transfer, skip it
		// @ts-ignore
		if (onlyTransfers && !item.isTransfer) {
			return false;
		}

		// timerange doesn't match
		if (
			timerange.length > 0 &&
			(item.timestamp < timerange[0] || item.timestamp > timerange[1])
		) {
			return false;
		}

		// txType doesn't match
		if (txType !== undefined && item.txType !== txType) {
			return false;
		}

		// if no tags filter, skip it
		if (tags.length === 0) {
			return true;
		}

		const itemTags = metaTags[item.id] ?? [];

		// check all search tags are in item tags
		if (itemTags.length > 0 && tags.every((t) => itemTags.includes(t))) {
			return true;
		}

		return false;
	});
};

export const groupActivityItems = (
	activityItems: IActivityItem[],
): Array<string | IActivityItem> => {
	const date = new Date();
	const beginningOfDay = +new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const beginningOfYesterday = +new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate() - 1,
	);
	const beginningOfMonth = +new Date(date.getFullYear(), date.getMonth());
	const beginningOfYear = new Date(date.getFullYear(), 0, 1).getTime();

	const today: IActivityItem[] = [];
	const yesterday: IActivityItem[] = [];
	const month: IActivityItem[] = [];
	const year: IActivityItem[] = [];
	const earlier: IActivityItem[] = [];

	for (let item of activityItems) {
		if (item.timestamp >= beginningOfDay) {
			today.push(item);
		} else if (item.timestamp >= beginningOfYesterday) {
			yesterday.push(item);
		} else if (item.timestamp >= beginningOfMonth) {
			month.push(item);
		} else if (item.timestamp >= beginningOfYear) {
			year.push(item);
		} else {
			earlier.push(item);
		}
	}

	let result: Array<string | IActivityItem> = [];
	if (today.length > 0) {
		// 'TODAY'
		const grpupName = i18nTime
			.t('relativeTime', {
				v: 0,
				range: 'day',
				numeric: 'auto',
			})
			.toUpperCase();

		result = [...result, grpupName, ...today];
	}
	if (yesterday.length > 0) {
		// 'YESTERDAY'
		const groupName = i18nTime
			.t('relativeTime', {
				v: -1,
				range: 'day',
				numeric: 'auto',
			})
			.toUpperCase();

		result = [...result, groupName, ...yesterday];
	}
	if (month.length > 0) {
		// 'THIS MONTH'
		const groupName = i18nTime
			.t('relativeTime', {
				v: 0,
				range: 'month',
				numeric: 'auto',
			})
			.toUpperCase();

		result = [...result, groupName, ...month];
	}
	if (year.length > 0) {
		// 'THIS YEAR'
		const groupName = i18nTime
			.t('relativeTime', {
				v: 0,
				range: 'year',
				numeric: 'auto',
			})
			.toUpperCase();

		result = [...result, groupName, ...year];
	}
	if (earlier.length > 0) {
		// EARLIER
		const groupName = i18n.t('other:earlier').toUpperCase();
		result = [...result, groupName, ...earlier];
	}

	return result;
};

export const getActivityItemDate = (timestamp: number): string => {
	const date = new Date();
	const beginningOfYesterday = +new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate() - 1,
	);
	const beginningOfYear = new Date(date.getFullYear(), 0, 1).getTime();

	if (timestamp >= beginningOfYesterday) {
		// today & yesterday, format as 22:40
		return i18nTime.t('dateTime', {
			v: new Date(timestamp),
			formatParams: {
				v: {
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				},
			},
		});
	}

	if (timestamp >= beginningOfYear) {
		// current year, format as April 4, 08:29
		return i18nTime.t('dateTime', {
			v: new Date(timestamp),
			formatParams: {
				v: {
					month: 'long',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				},
			},
		});
	}

	// before current year, format as February 2, 2021, 09:14
	return i18nTime.t('dateTime', {
		v: new Date(timestamp),
		formatParams: {
			v: {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				hour12: false,
			},
		},
	});
};
