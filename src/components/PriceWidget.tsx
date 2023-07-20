import React, { memo, ReactElement, useEffect, useState } from 'react';
import { View, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import b4a from 'b4a';

import { Caption13M, Text02M } from '../styles/text';
import { useSlashfeed } from '../hooks/widgets';
import { IWidget } from '../store/types/widgets';
import BaseFeedWidget from './BaseFeedWidget';
import { Chart, getChange, THistory } from './PriceChart';

const PriceWidget = ({
	url,
	widget,
	isEditing = false,
	style,
	onLongPress,
	onPressIn,
	testID,
}: {
	url: string;
	widget: IWidget;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	onLongPress?: () => void;
	onPressIn?: () => void;
	testID?: string;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const [history, setHistory] = useState<THistory[]>([]);
	const { drive, fields, config, loading } = useSlashfeed({
		url,
		fields: widget.fields,
	});

	const period = widget.extras?.period!;

	useEffect(() => {
		let unmounted = false;

		if (!drive) {
			return;
		}

		const getPastValues = async (): Promise<void> => {
			const promises = widget.fields.map(async (field) => {
				const pair = field.name;
				const buffer: Uint8Array = await drive.get(field.files[period]);
				const pastValues: number[] = JSON.parse(b4a.toString(buffer));
				const change = getChange(pastValues);

				return { pair, change, pastValues };
			});

			const rowData = await Promise.all(promises);

			if (!unmounted) {
				setHistory(rowData);
			}
		};

		getPastValues();

		return () => {
			unmounted = true;
		};
	}, [drive, widget.fields, period]);

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
				{fields.map((field) => {
					const historical = history.find((d) => d.pair === field.name);

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
								{historical && (
									<Text02M
										style={styles.change}
										color={historical.change.color}>
										{historical.change.formatted}
									</Text02M>
								)}
								<Text02M numberOfLines={1}>{field.value}</Text02M>
							</View>
						</View>
					);
				})}

				{history[0] && (
					<Chart
						style={styles.chart}
						values={history[0].pastValues}
						positive={history[0].change.color === 'green'}
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
