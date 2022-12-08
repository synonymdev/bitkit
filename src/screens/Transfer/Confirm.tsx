import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

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
import Store from '../../store/types';
import { addTodo } from '../../store/actions/todos';
import { confirmChannelPurchase } from '../../store/actions/blocktank';
import { useLightningBalance } from '../../hooks/lightning';
import useDisplayValues from '../../hooks/displayValues';
import type { TransferScreenProps } from '../../navigation/types';

const PIE_SIZE = 140;
const PIE_SHIFT = 70;

const Confirm = ({
	navigation,
	route,
}: TransferScreenProps<'Confirm'>): ReactElement => {
	const { total, spendingAmount, orderId } = route.params;
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

	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const orders = useSelector((state: Store) => state.blocktank.orders);
	const order = useMemo(() => {
		return orders.find((o) => o._id === orderId);
	}, [orderId, orders]);

	const blocktankPurchaseFee = useDisplayValues(order?.price ?? 0);
	const transactionFee = useSelector(
		(state: Store) =>
			state.wallet.wallets[selectedWallet].transaction[selectedNetwork].fee,
	);
	const fiatTransactionFee = useDisplayValues(transactionFee ?? 0);
	const channelOpenCost = useMemo(() => {
		return (
			blocktankPurchaseFee.fiatValue + fiatTransactionFee.fiatValue
		).toFixed(2);
	}, [blocktankPurchaseFee, fiatTransactionFee.fiatValue]);

	const handleConfirm = async (): Promise<void> => {
		setLoading(true);

		if (orderId) {
			// savings -> spending
			setLoading(true);
			const res = await confirmChannelPurchase({ orderId, selectedNetwork });
			if (res.isErr()) {
				setLoading(false);
				return;
			}
			setLoading(false);
			addTodo('transferInProgress');
			navigation.navigate('Success', { type: 'spending' });
		} else {
			// spending -> savings
			navigation.navigate('Availability');
		}
	};

	const text = isTransferringToSavings ? (
		<Text01S color="gray1" style={styles.text}>
			There is a small cost to transfer your full spending balance back to your
			savings. The exact fee depends on network conditions.
		</Text01S>
	) : (
		<Text01S color="gray1" style={styles.text}>
			It costs{' '}
			<Text01S>
				{blocktankPurchaseFee.fiatSymbol}
				{channelOpenCost}
			</Text01S>{' '}
			to transfer the additional funds to your spending balance.
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
						<AmountToggle sats={spendingAmount} unit="fiat" />
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

export default Confirm;
