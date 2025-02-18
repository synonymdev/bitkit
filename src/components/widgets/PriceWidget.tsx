import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import usePriceWidget from '../../hooks/usePriceWidget';
import { TPriceWidgetOptions } from '../../store/types/widgets';
import { BodySSB, CaptionB } from '../../styles/text';
import { Chart } from '../PriceChart';
import BaseWidget from './BaseWidget';

const PriceWidget = ({
	options,
	isEditing = false,
	style,
	testID,
	onLongPress,
	onPressIn,
}: {
	options: TPriceWidgetOptions;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('widgets');
	const { data, status } = usePriceWidget(options.pairs, options.period);

	return (
		<BaseWidget
			id="price"
			style={style}
			// isLoading={loading}
			isEditing={isEditing}
			testID={testID}
			onLongPress={onLongPress}
			onPressIn={onPressIn}>
			<>
				{data?.map((pair) => {
					return (
						<View
							key={pair.name}
							style={styles.row}
							testID={`PriceWidgetRow-${pair.name}`}>
							<View style={styles.columnLeft}>
								<BodySSB color="secondary" numberOfLines={1}>
									{pair.name}
								</BodySSB>
							</View>
							<View style={styles.columnRight}>
								<BodySSB style={styles.change} color={pair.change.color}>
									{pair.change.formatted}
								</BodySSB>
								<BodySSB numberOfLines={1}>{pair.price}</BodySSB>
							</View>
						</View>
					);
				})}

				{(status === 'error' || !data?.[0].pastValues) && (
					<View style={styles.row}>
						<View style={styles.columnLeft}>
							<CaptionB color="secondary" numberOfLines={1}>
								{t('price.error')}
							</CaptionB>
						</View>
					</View>
				)}

				{data && data.length > 0 && data[0].pastValues && (
					<Chart
						style={styles.chart}
						values={data[0].pastValues}
						positive={data[0].change.color === 'green'}
						period={options.period}
					/>
				)}

				{options.showSource && (
					<View style={styles.source} testID="PriceWidgetSource">
						<View style={styles.columnLeft}>
							<CaptionB color="secondary" numberOfLines={1}>
								{t('widget.source')}
							</CaptionB>
						</View>
						<View style={styles.columnRight}>
							<CaptionB color="secondary" numberOfLines={1}>
								Bitfinex.com
							</CaptionB>
						</View>
					</View>
				)}
			</>
		</BaseWidget>
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
