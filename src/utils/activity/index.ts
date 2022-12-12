import {
	EActivityTypes,
	IActivityItem,
	IActivityItemFormatted,
} from '../../store/types/activity';
import {
	EPaymentType,
	IFormattedTransaction,
	IFormattedTransactionContent,
} from '../../store/types/wallet';
import { defaultActivityItemShape } from '../../store/shapes/activity';

/**
 * Converts list of formatted transactions to array of activity items
 * @param transactions
 */
export const onChainTransactionsToActivityItems = (
	transactions: IFormattedTransaction,
): IActivityItem[] => {
	let items: IActivityItem[] = [];
	Object.keys(transactions).forEach((txid) => {
		const activityItem = onChainTransactionToActivityItem(transactions[txid]);
		items.push(activityItem);
	});
	return items;
};

/**
 * Converts a formatted transaction to an activity items
 * @param {IFormattedTransactionContent} transaction
 * @return IActivityItem
 */
export const onChainTransactionToActivityItem = (
	transaction: IFormattedTransactionContent,
): IActivityItem => {
	const {
		value,
		fee,
		type: txType,
		address,
		height,
		timestamp,
		messages,
	} = transaction;

	return {
		...defaultActivityItemShape,
		id: transaction.txid,
		activityType: EActivityTypes.onChain,
		txType,
		confirmed: height > 0,
		value: Math.round(value * 100000000),
		fee,
		message: messages.length > 0 ? messages[0] : '',
		address,
		timestamp,
	};
};

/**
 * Appends any new activity items while updating existing ones
 * @param oldItems
 * @param newItems
 * @returns {IActivityItem[]}
 */
export const mergeActivityItems = (
	oldItems: IActivityItem[],
	newItems: IActivityItem[],
): IActivityItem[] => {
	const reduced = oldItems.filter(
		(oldItem) =>
			!newItems.find(
				(newItem) =>
					newItem.activityType === oldItem.activityType &&
					newItem.id === oldItem.id,
			),
	);
	const mergedItems = reduced.concat(newItems);

	// Receive should be before Sent if they have same timestamp
	const sortOrder = ['received', 'sent'];
	const sortedItems = mergedItems.sort(
		(a, b) =>
			b.timestamp - a.timestamp ||
			sortOrder.indexOf(b.txType) - sortOrder.indexOf(a.txType),
	);

	return sortedItems;
};

/**
 * Filters activity items based on search string, type list or tags
 * @param items
 * @param metaTags
 * @param filter
 */
export const filterActivityItems = (
	items: IActivityItem[],
	metaTags: { [txid: string]: Array<string> },
	{
		search = '',
		types = [],
		tags = [],
		txType = undefined,
	}: {
		search?: string;
		types?: EActivityTypes[];
		tags?: Array<string>;
		txType?: EPaymentType;
	},
): IActivityItem[] => {
	const lowerSearch = search.toLowerCase();
	return items.filter((item) => {
		// If there is a search set and it's not found in the message, txid, address or value
		// then don't bother continuing
		if (
			search &&
			!(
				item.message.toLowerCase().includes(lowerSearch) ||
				item.id?.toLowerCase().includes(lowerSearch) ||
				item.address?.toLowerCase().includes(lowerSearch) ||
				item.value.toString().includes(lowerSearch)
			)
		) {
			return false;
		}

		// type doesn't match
		if (types.length > 0 && !types.includes(item.activityType)) {
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
): IActivityItemFormatted[] => {
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
	const beginningOfYear = +new Date(date.getFullYear());

	const today: Array<any> = [];
	const yesterday: Array<any> = [];
	const month: Array<any> = [];
	const year: Array<any> = [];
	const earlier: Array<any> = [];

	for (let item of activityItems) {
		if (item.timestamp >= beginningOfDay) {
			// today format as 22:40
			today.push({
				...item,
				formattedDate: new Date(item.timestamp).toLocaleString(undefined, {
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				}),
			});
		} else if (item.timestamp >= beginningOfYesterday) {
			// yesterday format as 22:40
			yesterday.push({
				...item,
				formattedDate: new Date(item.timestamp).toLocaleString(undefined, {
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				}),
			});
		} else if (item.timestamp >= beginningOfMonth) {
			// month, format as April 4, 08:29
			month.push({
				...item,
				formattedDate: new Date(item.timestamp).toLocaleString(undefined, {
					month: 'long',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				}),
			});
		} else if (item.timestamp >= beginningOfYear) {
			// year, format as April 4, 08:29
			year.push({
				...item,
				formattedDate: new Date(item.timestamp).toLocaleString(undefined, {
					month: 'long',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				}),
			});
		} else {
			// earlier, format as February 2, 2021, 09:14
			earlier.push({
				...item,
				formattedDate: new Date(item.timestamp).toLocaleString(undefined, {
					month: 'long',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				}),
			});
		}
	}

	let result: Array<any> = [];
	if (today.length > 0) {
		result = [...result, 'TODAY', ...today];
	}
	if (yesterday.length > 0) {
		result = [...result, 'YESTERDAY', ...yesterday];
	}
	if (month.length > 0) {
		result = [...result, 'THIS MONTH', ...month];
	}
	if (year.length > 0) {
		result = [...result, 'THIS YEAR', ...year];
	}
	if (earlier.length > 0) {
		result = [...result, 'EARLIER', ...earlier];
	}

	return result;
};

export const updateLastUsedTags = (
	oldTags: Array<string>,
	newTags: Array<string>,
): Array<string> => {
	let tags = [...newTags, ...oldTags];
	tags = [...new Set(tags)];
	tags = tags.slice(0, 10);
	return tags;
};
