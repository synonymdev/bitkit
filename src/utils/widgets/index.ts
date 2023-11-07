import { SlashFeedJSON } from '../../store/types/widgets';
import { i18nTime } from '../../utils/i18n';

export enum SUPPORTED_FEED_TYPES {
	PRICE_FEED = 'exchange.price_history_timestamped',
	HEADLINES_FEED = 'news.headlines',
	BLOCKS_FEED = 'bitcoin.stats',
	FACTS_FEED = 'quotes',
	LUGANO_FEED = 'to.synonym.lugano-feed',
}

/**
 * Decode field value according to the feed type, and field name.
 * For unknown types or fields, it will decode using utf-8
 * and limit to 35 character (feel free to change or remove that limit in the future)
 */
export const decodeWidgetFieldValue = (
	type: string,
	field: SlashFeedJSON['field'][0],
	value: any,
): any => {
	switch (type) {
		case SUPPORTED_FEED_TYPES.PRICE_FEED: {
			try {
				const currency = field.quote;
				const price = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency:
						currency === 'EUT' ? 'EUR' : currency === 'UST' ? 'USD' : currency,
				})
					.formatToParts(value)
					.reduce((prev, part) => {
						return ['currency', 'integer', 'group'].includes(part.type)
							? prev + part.value
							: prev;
					}, '');

				return price;
			} catch (error) {
				return error.message;
			}
		}

		case SUPPORTED_FEED_TYPES.BLOCKS_FEED: {
			const json = value;
			const { format } = new Intl.NumberFormat('en-US');

			if (field.name === 'Block') {
				return format(json);
			}
			if (field.name === 'Time') {
				const formatted = i18nTime.t('dateTime', {
					v: new Date(json * 1000),
					formatParams: {
						v: {
							hour: 'numeric',
							minute: 'numeric',
							second: 'numeric',
						},
					},
				});
				return formatted;
			}
			if (field.name === 'Date') {
				const formatted = i18nTime.t('dateTime', {
					v: new Date(json * 1000),
					formatParams: {
						v: {
							year: 'numeric',
							month: 'short',
							day: 'numeric',
						},
					},
				});
				return formatted;
			}
			if (field.name === 'Transactions') {
				return format(json);
			}
			if (field.name === 'Size') {
				return `${format(Math.trunc(json))} Kb`;
			}
			if (field.name === 'Weight') {
				return `${format(json)} MWU`;
			}

			return json;
		}

		default: {
			let val = value;
			// Remove extra JSON stringification
			if (typeof val === 'string') {
				try {
					val = JSON.parse(val);
				} catch {}
			}
			// Avoid [object Object]
			if (typeof val === 'object') {
				val = JSON.stringify(val);
			}
			return val;
		}
	}
};
