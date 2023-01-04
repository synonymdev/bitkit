import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Caption13Up, Display, Text01S } from '../../styles/text';
import { LightningIcon } from '../../styles/icons';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import AmountToggle from '../../components/AmountToggle';
import Percentage from '../../components/Percentage';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import PieChart from './PieChart';
import { sleep } from '../../utils/helpers';
import { confirmChannelPurchase } from '../../store/actions/blocktank';
import { addTodo } from '../../store/actions/todos';
import useDisplayValues from '../../hooks/displayValues';
import type { LightningScreenProps } from '../../navigation/types';
import {
	selectedNetworkSelector,
	transactionFeeSelector,
} from '../../store/reselect/wallet';
import { blocktankOrdersSelector } from '../../store/reselect/blocktank';

const PIE_SIZE = 140;
const PIE_SHIFT = 70;

const QuickConfirm = ({
	navigation,
	route,
}: LightningScreenProps<'QuickConfirm'>): ReactElement => {
	const { spendingAmount, total, orderId } = route.params;
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const orders = useSelector(blocktankOrdersSelector);
	const order = useMemo(() => {
		return orders.find((o) => o._id === orderId);
	}, [orderId, orders]);
	const blocktankPurchaseFee = useDisplayValues(order?.price ?? 0);
	const transactionFee = useSelector(transactionFeeSelector);
	const fiatTransactionFee = useDisplayValues(transactionFee ?? 0);
	const channelOpenCost = useMemo(() => {
		return (
			blocktankPurchaseFee.fiatValue + fiatTransactionFee.fiatValue
		).toFixed(2);
	}, [fiatTransactionFee.fiatValue, blocktankPurchaseFee.fiatValue]);

	const [loading, setLoading] = useState(false);

	const savingsAmount = total - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / total) * 100);
	const savingsPercentage = Math.round((savingsAmount / total) * 100);

	const handleConfirm = async (): Promise<void> => {
		setLoading(true);
		await sleep(5);
		const res = await confirmChannelPurchase({ orderId, selectedNetwork });
		if (res.isErr()) {
			setLoading(false);
			return;
		}
		addTodo('lightningSettingUp');
		navigation.navigate('Result');
	};

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Add Instant Payments"
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root}>
				<View>
					<Display color="purple">Please {'\n'}Confirm.</Display>
					<Text01S color="gray1" style={styles.text}>
						It costs
						<Text01S>{` ${blocktankPurchaseFee.fiatSymbol}${channelOpenCost} `}</Text01S>
						to connect you to Lightning and set up your spending balance.
					</Text01S>
				</View>

				<View style={styles.chartContainer}>
					<View style={styles.chart}>
						<PieChart
							size={PIE_SIZE}
							shift={PIE_SHIFT}
							primary={spendingPercentage}
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
							text="Swipe To Connect"
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

export default QuickConfirm;
