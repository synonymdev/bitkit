import React, { ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
	Caption13Up,
	Display,
	LightningIcon,
	Text01S,
} from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import AmountToggle from '../../components/AmountToggle';
import Percentage from '../../components/Percentage';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import PieChart from '../Lightning/PieChart';
import { useLightningBalance } from '../../hooks/lightning';
import { addTodo } from '../../store/actions/todos';
import type { TransferScreenProps } from '../../navigation/types';

const PIE_SIZE = 140;
const PIE_SHIFT = 70;

const RebalanceConfirm = ({
	navigation,
	route,
}: TransferScreenProps<'Confirm'>): ReactElement => {
	const { total, spendingAmount } = route.params;
	const [loading, setLoading] = useState(false);
	const lightningBalance = useLightningBalance();

	const savingsAmount = total - spendingAmount;
	const savingsPercentage = Math.round((savingsAmount / total) * 100);
	const currentSpendingAmount = lightningBalance.localBalance;
	const spendingPercentage = Math.round((spendingAmount / total) * 100);
	const spendingCurrentPercentage = Math.round(
		(currentSpendingAmount / total) * 100,
	);

	const isTransferringToSavings = spendingAmount < currentSpendingAmount;

	const handleConfirm = async (): Promise<void> => {
		setLoading(true);

		if (isTransferringToSavings) {
			navigation.navigate('Availability');
		} else {
			// TODO: open additional channel
			addTodo('transferInProgress');
			navigation.navigate('Success', { type: 'spending' });
		}
	};

	// TODO: get rebalance fee
	const channelOpenCost = 123;
	const channelCloseCost = 123;
	const fiatSymbol = '$';

	const text = isTransferringToSavings ? (
		<Text01S color="gray1" style={styles.text}>
			It costs{' '}
			<Text01S>
				{fiatSymbol}
				{channelOpenCost}
			</Text01S>{' '}
			to transfer all funds from your spending balance back to your savings.
		</Text01S>
	) : (
		<Text01S color="gray1" style={styles.text}>
			It costs{' '}
			<Text01S>
				{fiatSymbol}
				{channelCloseCost}
			</Text01S>{' '}
			to transfer the additionalfunds to your spending balance.
		</Text01S>
	);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Transfer Funds"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.root}>
				<View>
					<Display color="purple">Please {'\n'}Confirm.</Display>
					{text}
				</View>

				<View style={styles.chartContainer}>
					<View style={styles.chart}>
						<PieChart
							size={PIE_SIZE}
							shift={PIE_SHIFT}
							primary={spendingPercentage}
							dashed={spendingCurrentPercentage}
						/>
					</View>
					<View style={styles.percContainer}>
						<Percentage value={spendingPercentage} type="spending" />
						<Percentage value={savingsPercentage} type="savings" />
					</View>
				</View>

				<View>
					<View style={styles.amountBig}>
						<Caption13Up color="purple">Spending balance</Caption13Up>
						<AmountToggle sats={spendingAmount} />
					</View>

					<View style={styles.buttonContainer}>
						<SwipeToConfirm
							text="Swipe To Transfer"
							color="purple"
							icon={<LightningIcon width={30} height={30} color="black" />}
							loading={loading}
							confirmed={loading}
							onConfirm={handleConfirm}
						/>
					</View>
				</View>
			</View>
			<SafeAreaInsets type="bottom" />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'space-between',
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 8,
	},
	amountBig: {
		marginBottom: 32,
	},
	chartContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	chart: {
		marginTop: -PIE_SHIFT,
		marginLeft: -PIE_SHIFT,
		width: PIE_SIZE + PIE_SHIFT,
		height: PIE_SIZE + PIE_SHIFT,
		marginRight: 32,
	},
	percContainer: {
		alignSelf: 'stretch',
		justifyContent: 'space-around',
	},
	buttonContainer: {
		marginBottom: 16,
	},
});

export default RebalanceConfirm;
