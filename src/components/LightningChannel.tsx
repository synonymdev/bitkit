import React, { ReactElement, memo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Caption13Up } from '../styles/text';
import { DownArrow, UpArrow } from '../styles/icons';
import { View as ThemedView } from '../styles/components';
import { IThemeColors } from '../styles/themes';
import { EUnit } from '../store/types/wallet';
import Money from './Money';

export type TStatus = 'pending' | 'open' | 'closed';

const LightningChannel = ({
	capacity,
	localBalance,
	remoteBalance,
	status = 'pending',
	showLabels = false,
	style,
	testID,
}: {
	capacity: number;
	localBalance: number;
	remoteBalance: number;
	status?: TStatus;
	showLabels?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}): ReactElement => {
	const { t } = useTranslation('lightning');

	let spendingColor: keyof IThemeColors = 'purple50';
	let spendingAvailableColor: keyof IThemeColors = 'purple';
	let receivingColor: keyof IThemeColors = 'white64';
	let receivingAvailableColor: keyof IThemeColors = 'white';

	if (status === 'closed') {
		spendingColor = 'gray5';
		spendingAvailableColor = 'gray3';
		receivingColor = 'gray5';
		receivingAvailableColor = 'gray3';
	}

	const spendingAvailableStyle = {
		width: `${100 * (localBalance / capacity)}%`,
	};

	const receivingAvailableStyle = {
		width: `${100 * (remoteBalance / capacity)}%`,
	};

	return (
		<View
			style={[status === 'pending' && styles.pending, style]}
			testID={testID}>
			{showLabels && (
				<View style={styles.labels}>
					<Caption13Up color="secondary">{t('spending_label')}</Caption13Up>
					<Caption13Up color="secondary">{t('receiving_label')}</Caption13Up>
				</View>
			)}
			<View style={styles.amounts}>
				<View style={styles.amount}>
					<UpArrow color={spendingAvailableColor} width={14} height={14} />
					<Money
						sats={localBalance}
						color={spendingAvailableColor}
						size="captionB"
						unit={EUnit.BTC}
					/>
				</View>
				<View style={styles.amount}>
					<DownArrow color={receivingAvailableColor} width={14} height={14} />
					<Money
						sats={remoteBalance}
						color={receivingAvailableColor}
						size="captionB"
						unit={EUnit.BTC}
					/>
				</View>
			</View>
			<View style={styles.bars}>
				<ThemedView style={[styles.bar, styles.barLeft]} color={spendingColor}>
					<ThemedView
						style={[styles.barLeft, spendingAvailableStyle]}
						color={spendingAvailableColor}
					/>
				</ThemedView>
				<View style={styles.divider} />
				<ThemedView
					style={[styles.bar, styles.barRight]}
					color={receivingColor}>
					<ThemedView
						style={[styles.barRight, receivingAvailableStyle]}
						color={receivingAvailableColor}
					/>
				</ThemedView>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	pending: {
		opacity: 0.5,
	},
	labels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	amounts: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	amount: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	bars: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	bar: {
		flex: 1,
		flexDirection: 'row',
		height: 16,
	},
	barLeft: {
		borderTopLeftRadius: 16,
		borderBottomLeftRadius: 16,
		justifyContent: 'flex-end',
	},
	barRight: {
		borderTopRightRadius: 16,
		borderBottomRightRadius: 16,
	},
	divider: {
		width: 4,
	},
});

export default memo(LightningChannel);
