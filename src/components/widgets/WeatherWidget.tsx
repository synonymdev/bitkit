import React, { ReactElement } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useDisplayValues } from '../../hooks/displayValues';
import useWeatherWidget from '../../hooks/weatherWidget';
import { BodyM, BodyMSB, BodySSB, Title } from '../../styles/text';
import BaseWidget from './BaseWidget';

type TWeatherWidgetOptions = {
	showStatus: boolean;
	showText: boolean;
	showMedian: boolean;
	showNextBlockFee: boolean;
};

const WeatherWidget = ({
	options,
	isEditing = false,
	style,
	testID,
	onPressIn,
	onLongPress,
}: {
	options: TWeatherWidgetOptions;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPressIn?: () => void;
	onLongPress?: () => void;
}): ReactElement => {
	const { t } = useTranslation('widgets');
	const { data } = useWeatherWidget();
	const { condition, currentFee, nextBlockFee } = data;
	const currentFeeFiat = useDisplayValues(currentFee);

	return (
		<BaseWidget
			id="weather"
			// isLoading={status === 'loading'}
			isEditing={isEditing}
			style={style}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}>
			<View style={styles.container}>
				{options.showStatus && (
					<View style={styles.condition}>
						<Title style={styles.conditionText}>
							{t(`weather.condition.${condition}.title`)}
						</Title>

						<Title style={styles.conditionIcon}>
							{condition === 'good' && '☀️'}
							{condition === 'average' && '⛅'}
							{condition === 'poor' && '⛈️'}
						</Title>
					</View>
				)}

				{options.showText && (
					<BodyM>{t(`weather.condition.${condition}.description`)}</BodyM>
				)}

				{(options.showMedian || options.showNextBlockFee) && (
					<View style={styles.rows}>
						{options.showMedian && (
							<View style={styles.row}>
								<View style={styles.columnLeft}>
									<BodySSB color="secondary" numberOfLines={1}>
										{t('weather.current_fee')}
									</BodySSB>
								</View>
								<View style={styles.columnRight}>
									<BodyMSB numberOfLines={1}>
										{currentFeeFiat.fiatSymbol} {currentFeeFiat.fiatFormatted}
									</BodyMSB>
								</View>
							</View>
						)}

						{options.showNextBlockFee && (
							<View style={styles.row}>
								<View style={styles.columnLeft}>
									<BodySSB color="secondary" numberOfLines={1}>
										{t('weather.next_block')}
									</BodySSB>
								</View>
								<View style={styles.columnRight}>
									<BodyMSB numberOfLines={1}>{nextBlockFee} ₿/vByte</BodyMSB>
								</View>
							</View>
						)}
					</View>
				)}
			</View>
		</BaseWidget>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 16,
	},
	condition: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	conditionText: {
		fontSize: 34,
		fontWeight: 'bold',
		lineHeight: 34,
		letterSpacing: 0,
		maxWidth: '70%',
	},
	conditionIcon: {
		height: 100,
		marginTop: 0,
		paddingTop: 16,
		paddingBottom: -16,
		...Platform.select({
			ios: {
				fontSize: 100,
				lineHeight: 100,
			},
			android: {
				fontSize: 85,
				lineHeight: 85,
			},
		}),
	},
	rows: {
		gap: 8,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 20,
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
});

export default WeatherWidget;
