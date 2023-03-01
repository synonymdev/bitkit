import { btcToSats } from '../helpers';
import { TPaidBlocktankOrders } from '../../store/types/blocktank';
import { EPaymentType, IFormattedTransaction } from '../../store/types/wallet';
import {
	EActivityType,
	IActivityItem,
	IActivityItemFormatted,
	TOnchainActivityItem,
} from '../../store/types/activity';
import i18n from '../../utils/i18n';

/**
 * Converts a formatted transaction to an activity item
 * @param {IFormattedTransaction} transaction
 * @returns {TOnchainActivityItem} activityItem
 */
export const onChainTransactionToActivityItem = ({
	transaction,
	blocktankTransactions,
}: {
	transaction: IFormattedTransaction;
	blocktankTransactions: TPaidBlocktankOrders;
}): TOnchainActivityItem => {
	// subtract fee from amount if applicable
	const amount =
		transaction.type === 'sent'
			? transaction.value + transaction.fee
			: transaction.value;

	// check if tx is a payment to Blocktank (i.e. transfer to spending)
	const isTransferTx = !!Object.values(blocktankTransactions).find(
		(txId) => transaction.txid === txId,
	);

	return {
		id: transaction.txid,
		activityType: EActivityType.onchain,
		txType: transaction.type,
		txId: transaction.txid,
		value: btcToSats(Math.abs(amount)),
		fee: transaction.fee,
		feeRate: transaction.satsPerByte,
		address: transaction.address,
		confirmed: transaction.height > 0,
		isBoosted: false,
		isTransfer: isTransferTx,
		timestamp: transaction.timestamp,
	};
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
	const reduced = oldItems.filter(
		(oldItem) =>
			!newItems.find((newItem) => {
				return (
					newItem.activityType === oldItem.activityType &&
					newItem.id === oldItem.id
				);
			}),
	);
	const mergedItems = reduced.concat(newItems);

	// 'Received' should be before 'Sent' if they have same timestamp
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
	metaTags: { [txid: string]: string[] },
	{
		search = '',
		types = [],
		tags = [],
		txType,
	}: {
		search?: string;
		types?: EActivityType[];
		tags?: string[];
		txType?: EPaymentType;
	},
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
): Array<string | IActivityItemFormatted> => {
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

	const today: IActivityItemFormatted[] = [];
	const yesterday: IActivityItemFormatted[] = [];
	const month: IActivityItemFormatted[] = [];
	const year: IActivityItemFormatted[] = [];
	const earlier: IActivityItemFormatted[] = [];

	for (let item of activityItems) {
		if (item.timestamp >= beginningOfDay) {
			// today format as 22:40
			today.push({
				...item,
				formattedDate: i18n.t('intl:dateTime', {
					v: new Date(item.timestamp),
					formatParams: {
						v: {
							hour: 'numeric',
							minute: 'numeric',
							hour12: false,
						},
					},
				}),
			});
		} else if (item.timestamp >= beginningOfYesterday) {
			// yesterday format as 22:40
			yesterday.push({
				...item,
				formattedDate: i18n.t('intl:dateTime', {
					v: new Date(item.timestamp),
					formatParams: {
						v: {
							hour: 'numeric',
							minute: 'numeric',
							hour12: false,
						},
					},
				}),
			});
		} else if (item.timestamp >= beginningOfMonth) {
			// month, format as April 4, 08:29
			month.push({
				...item,
				formattedDate: i18n.t('intl:dateTime', {
					v: new Date(item.timestamp),
					formatParams: {
						v: {
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: 'numeric',
							hour12: false,
						},
					},
				}),
			});
		} else if (item.timestamp >= beginningOfYear) {
			// year, format as April 4, 08:29
			year.push({
				...item,
				formattedDate: i18n.t('intl:dateTime', {
					v: new Date(item.timestamp),
					formatParams: {
						v: {
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: 'numeric',
							hour12: false,
						},
					},
				}),
			});
		} else {
			// earlier, format as February 2, 2021, 09:14
			earlier.push({
				...item,
				formattedDate: i18n.t('intl:dateTime', {
					v: new Date(item.timestamp),
					formatParams: {
						v: {
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: 'numeric',
							hour12: false,
						},
					},
				}),
			});
		}
	}

	let result: Array<string | IActivityItemFormatted> = [];
	if (today.length > 0) {
		result = [
			...result,
			// 'TODAY'
			i18n
				.t('intl:relativeTime', {
					v: 0,
					range: 'day',
					numeric: 'auto',
				})
				.toUpperCase(),
			...today,
		];
	}
	if (yesterday.length > 0) {
		result = [
			...result,
			// 'YESTERDAY'
			i18n
				.t('intl:relativeTime', {
					v: -1,
					range: 'day',
					numeric: 'auto',
				})
				.toUpperCase(),
			...yesterday,
		];
	}
	if (month.length > 0) {
		result = [
			...result,
			// 'THIS MONTH'
			i18n
				.t('intl:relativeTime', {
					v: 0,
					range: 'month',
					numeric: 'auto',
				})
				.toUpperCase(),
			...month,
		];
	}
	if (year.length > 0) {
		result = [
			...result,
			// 'THIS YEAR'
			i18n
				.t('intl:relativeTime', {
					v: 0,
					range: 'year',
					numeric: 'auto',
				})
				.toUpperCase(),
			...year,
		];
	}
	if (earlier.length > 0) {
		result = [
			...result,
			// EARLIER
			i18n.t('other:earlier').toUpperCase(),
			...earlier,
		];
	}

	return result;
};
