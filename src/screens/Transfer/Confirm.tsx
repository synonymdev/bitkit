import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up, Display, Text01S } from '../../styles/text';
import { LightningIcon } from '../../styles/icons';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import AmountToggle from '../../components/AmountToggle';
import Percentage from '../../components/Percentage';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import PieChart from '../Lightning/PieChart';
import { addTodo, removeTodo } from '../../store/actions/todos';
import { confirmChannelPurchase } from '../../store/actions/blocktank';
import { useLightningBalance } from '../../hooks/lightning';
import useDisplayValues from '../../hooks/displayValues';
import type { TransferScreenProps } from '../../navigation/types';
import { blocktankOrdersSelector } from '../../store/reselect/blocktank';
import {
	selectedNetworkSelector,
	transactionFeeSelector,
} from '../../store/reselect/wallet';

const PIE_SIZE = 140;
const PIE_SHIFT = 70;

const Confirm = ({
	navigation,
	route,
}: TransferScreenProps<'Confirm'>): ReactElement => {
	const { t } = useTranslation('lightning');
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

	const selectedNetwork = useSelector(selectedNetworkSelector);
	const orders = useSelector(blocktankOrdersSelector);
	const order = useMemo(() => {
		return orders.find((o) => o._id === orderId);
	}, [orderId, orders]);

	const blocktankPurchaseFee = useDisplayValues(order?.price ?? 0);
	const transactionFee = useSelector(transactionFeeSelector);
	const fiatTransactionFee = useDisplayValues(transactionFee);
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
			removeTodo('transfer');
			addTodo('transferToSpending');
			navigation.navigate('Success', { type: 'spending' });
		} else {
			setLoading(false);
			// spending -> savings
			navigation.navigate('Availability');
		}
	};

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={t('transfer_funds')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root}>
				<View>
					<Display color="purple">{t('transfer_header')}</Display>
					<Text01S color="gray1" style={styles.text}>
						{isTransferringToSavings ? (
							t('transfer_close')
						) : (
							<Trans
								t={t}
								i18nKey="transfer_open"
								components={{
									white: <Text01S color="white" />,
								}}
								values={{
									amount: `${blocktankPurchaseFee.fiatSymbol}${channelOpenCost}`,
								}}
							/>
						)}
					</Text01S>
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
						<Caption13Up color="purple">{t('spending_label')}</Caption13Up>
						<AmountToggle sats={spendingAmount} />
					</View>

					<View style={styles.buttonContainer}>
						<SwipeToConfirm
							text={t('transfer_swipe')}
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
