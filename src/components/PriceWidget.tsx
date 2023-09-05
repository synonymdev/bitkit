import React, { memo, ReactElement, useEffect, useState } from 'react';
import { View, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Reader } from '@synonymdev/price-feed';
import { Pair } from '@synonymdev/price-feed/types/lib/reader';

import { Caption13M, Text02M } from '../styles/text';
import { useSlashfeed } from '../hooks/widgets';
import { IWidget } from '../store/types/widgets';
import BaseFeedWidget from './BaseFeedWidget';
import { webRelayClient, webRelayUrl } from './SlashtagsProvider2';
import { Change, Chart, getChange } from './PriceChart';
import { decodeWidgetFieldValue, SUPPORTED_FEED_TYPES } from '../utils/widgets';
import { __E2E__ } from '../constants/env';

type TField = {
	name: string;
	pair: string;
	change: Change;
	price: string;
	pastValues: number[];
};

const PriceWidget = ({
	url,
	widget,
	isEditing = false,
	style,
	testID,
	onLongPress,
	onPressIn,
}: {
	url: string;
	widget: IWidget;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const [data, setData] = useState<TField[]>([]);
	const [error, setError] = useState(false);
	const { config, loading } = useSlashfeed({
		url,
		fields: widget.fields,
	});

	const period = widget.extras?.period!;

	useEffect(() => {
		const feedUrl = `${url}?relay=${webRelayUrl}`;
		const reader = new Reader(webRelayClient, feedUrl);

		const getPastValues = async (): Promise<void> => {
			const promises = widget.fields.map(async (field) => {
				const pair = `${field.base}${field.quote}` as Pair;
				const candles = await reader.getPastCandles(pair, period);

				if (!candles) {
					throw Error('No candles');
				}

				const pastValues: number[] = candles.map((candle) => candle.close);
				const change = getChange(pastValues);
				const price = decodeWidgetFieldValue(
					SUPPORTED_FEED_TYPES.PRICE_FEED,
					field,
					pastValues[pastValues.length - 1],
				);

				return { name: field.name, pair, price, change, pastValues };
			});

			try {
				const rowData = await Promise.all(promises);
				setData(rowData);
				setError(false);
			} catch (err) {
				console.log({ err });
				setError(true);
			}
		};

		getPastValues();

		const subscriptions = widget.fields.map((field) => {
			const pair = `${field.base}${field.quote}` as Pair;

			// subscriptions are breaking e2e tests
			if (!__E2E__) {
				const unsubscribe = reader.subscribeLatestPrice(pair, (updatePrice) => {
					setData((prev) => {
						const pairData = prev.find((f) => f.name === field.name);

						if (pairData) {
							const change = getChange([...pairData.pastValues, updatePrice]);
							const price = decodeWidgetFieldValue(
								SUPPORTED_FEED_TYPES.PRICE_FEED,
								field,
								updatePrice,
							);
							const updated = { ...pairData, change, price };

							// replace old data while keeping the order
							return prev.map((d) => (d !== pairData ? d : updated));
						} else {
							return prev;
						}
					});
				});

				return unsubscribe;
			}
		});

		return () => {
			if (!__E2E__) {
				subscriptions.forEach((unsubscribe) => unsubscribe!());
			}
		};
	}, [url, widget.fields, period]);

	return (
		<BaseFeedWidget
			style={style}
			url={url}
			name={t('widget_price')}
			isLoading={loading}
			isEditing={isEditing}
			testID={testID}
			onLongPress={onLongPress}
			onPressIn={onPressIn}>
			<>
				{data.map((field) => {
					return (
						<View
							key={field.name}
							style={styles.row}
							testID={`PriceWidgetRow-${field.name}`}>
							<View style={styles.columnLeft}>
								<Text02M color="gray1" numberOfLines={1}>
									{field.name}
								</Text02M>
							</View>
							<View style={styles.columnRight}>
								<Text02M style={styles.change} color={field.change.color}>
									{field.change.formatted}
								</Text02M>
								<Text02M numberOfLines={1}>{field.price}</Text02M>
							</View>
						</View>
					);
				})}

				{(data.length === 0 || !data[0].pastValues || error) && (
					<View style={styles.row}>
						<View style={styles.columnLeft}>
							<Caption13M color="gray1" numberOfLines={1}>
								No historical data
							</Caption13M>
						</View>
					</View>
				)}

				{data.length > 0 && data[0].pastValues && (
					<Chart
						style={styles.chart}
						values={data[0].pastValues}
						positive={data[0].change.color === 'green'}
						period={period}
					/>
				)}

				{widget.extras?.showSource && config?.source && (
					<View style={styles.source} testID="PriceWidgetSource">
						<View style={styles.columnLeft}>
							<Caption13M color="gray1" numberOfLines={1}>
								{t('widget_source')}
							</Caption13M>
						</View>
						<View style={styles.columnRight}>
							<Caption13M color="gray1" numberOfLines={1}>
								{config.source.name}
							</Caption13M>
						</View>
					</View>
				)}
			</>
		</BaseFeedWidget>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 28,
	},
	columnLeft: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	columnRight: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	change: {
		marginRight: 8,
	},
	chart: {
		marginTop: 8,
	},
	source: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default memo(PriceWidget);
