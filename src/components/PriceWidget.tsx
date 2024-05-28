import React, { memo, ReactElement, useEffect, useState } from 'react';
import { View, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Reader } from '@synonymdev/slashtags-widget-price-feed';
import { Pair } from '@synonymdev/slashtags-widget-price-feed/types/lib/reader';

import { CaptionB, BodySSB } from '../styles/text';
import { useSlashfeed } from '../hooks/widgets';
import { TFeedWidget } from '../store/types/widgets';
import BaseFeedWidget from './BaseFeedWidget';
import { Change, Chart, getChange } from './PriceChart';
import { decodeWidgetFieldValue, SUPPORTED_FEED_TYPES } from '../utils/widgets';
import { useSlashtags } from '../hooks/slashtags';
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
	widget: TFeedWidget;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { webRelayClient, webRelayUrl } = useSlashtags();
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

		const getCandles = async (): Promise<void> => {
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

		// get data once then subscribe to updates
		getCandles();

		let subscriptions: (() => void)[] = [];

		// subscriptions are breaking e2e tests
		if (!__E2E__) {
			// subscribe to price updates
			subscriptions = widget.fields.map((field) => {
				const pair = `${field.base}${field.quote}` as Pair;

				const unsubscribe = reader.subscribeLatestPrice(
					pair,
					(updatedPrice) => {
						setData((prev) => {
							const pairData = prev.find((f) => f.name === field.name);

							if (pairData && updatedPrice) {
								const change = getChange([
									...pairData.pastValues,
									updatedPrice,
								]);
								// replace last candle with updated price
								const pastValues = [...pairData.pastValues].fill(
									updatedPrice,
									-1,
								);

								const price = decodeWidgetFieldValue(
									SUPPORTED_FEED_TYPES.PRICE_FEED,
									field,
									updatedPrice,
								);
								const updated = { ...pairData, pastValues, change, price };

								// replace old data while keeping the order
								return prev.map((d) => (d !== pairData ? d : updated));
							} else {
								return prev;
							}
						});
					},
				);

				return unsubscribe;
			});
		}

		return () => {
			subscriptions.forEach((unsubscribe) => unsubscribe());
		};
	}, [url, widget.fields, period, webRelayClient, webRelayUrl]);

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
								<BodySSB color="secondary" numberOfLines={1}>
									{field.name}
								</BodySSB>
							</View>
							<View style={styles.columnRight}>
								<BodySSB style={styles.change} color={field.change.color}>
									{field.change.formatted}
								</BodySSB>
								<BodySSB numberOfLines={1}>{field.price}</BodySSB>
							</View>
						</View>
					);
				})}

				{(data.length === 0 || !data[0].pastValues || error) && (
					<View style={styles.row}>
						<View style={styles.columnLeft}>
							<CaptionB color="secondary" numberOfLines={1}>
								No historical data
							</CaptionB>
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
							<CaptionB color="secondary" numberOfLines={1}>
								{t('widget_source')}
							</CaptionB>
						</View>
						<View style={styles.columnRight}>
							<CaptionB color="secondary" numberOfLines={1}>
								{config.source.name}
							</CaptionB>
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
