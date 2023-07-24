import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { TChannel } from '@synonymdev/react-native-ldk';

import { useLightningChannelBalance } from '../hooks/lightning';
import { View as ThemedView } from '../styles/components';
import { DownArrow, UpArrow } from '../styles/icons';
import { IThemeColors } from '../styles/themes';
import { EUnit } from '../store/types/wallet';
import Money from './Money';

export type TStatus = 'pending' | 'open' | 'closed';

const LightningChannel = ({
	channel,
	status = 'pending',
}: {
	channel: TChannel;
	status: TStatus;
}): ReactElement => {
	const { spendingAvailable, receivingAvailable, capacity } =
		useLightningChannelBalance(channel);

	let spendingColor: keyof IThemeColors = 'purple5';
	let spendingAvailableColor: keyof IThemeColors = 'purple';
	let receivingColor: keyof IThemeColors = 'white5';
	let receivingAvailableColor: keyof IThemeColors = 'white';

	if (status === 'closed') {
		spendingColor = 'gray5';
		spendingAvailableColor = 'gray3';
		receivingColor = 'gray5';
		receivingAvailableColor = 'gray3';
	}

	const spendingAvailableStyle = {
		width: `${100 * (spendingAvailable / capacity)}%`,
	};

	const receivingAvailableStyle = {
		width: `${100 * (receivingAvailable / capacity)}%`,
	};

	return (
		<View style={status === 'pending' && styles.pending}>
			<View style={styles.balances}>
				<View style={styles.balance}>
					<UpArrow color={spendingAvailableColor} width={14} height={14} />
					<Money
						sats={spendingAvailable}
						color={spendingAvailableColor}
						size="caption13M"
						unit={EUnit.satoshi}
					/>
				</View>
				<View style={styles.balance}>
					<DownArrow color={receivingAvailableColor} width={14} height={14} />
					<Money
						sats={receivingAvailable}
						color={receivingAvailableColor}
						size="caption13M"
						unit={EUnit.satoshi}
					/>
				</View>
			</View>
			<View style={styles.bars}>
				<ThemedView color={spendingColor} style={[styles.bar, styles.barLeft]}>
					<ThemedView
						color={spendingAvailableColor}
						style={[styles.barLeft, spendingAvailableStyle]}
					/>
				</ThemedView>
				<View style={styles.divider} />
				<ThemedView
					color={receivingColor}
					style={[styles.bar, styles.barRight]}>
					<ThemedView
						color={receivingAvailableColor}
						style={[styles.barRight, receivingAvailableStyle]}
					/>
				</ThemedView>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	balances: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	pending: {
		opacity: 0.5,
	},
	balance: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	bars: {
		marginTop: 8,
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
