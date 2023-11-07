import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up, Display, Text01S } from '../../styles/text';
import { LightningIcon } from '../../styles/icons';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import AmountToggle from '../../components/AmountToggle';
import Percentage from '../../components/Percentage';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import PieChart from '../Lightning/PieChart';
import { confirmChannelPurchase } from '../../store/actions/blocktank';
import { useBalance } from '../../hooks/wallet';
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
	const { spendingAmount, orderId } = route.params;
	const { t } = useTranslation('lightning');
	const [loading, setLoading] = useState(false);
	const { totalBalance, lightningBalance } = useBalance();

	const savingsAmount = totalBalance - spendingAmount;
	const savingsPercentage = Math.round((savingsAmount / totalBalance) * 100);
	const spendingPercentage = Math.round((spendingAmount / totalBalance) * 100);
	const spendingCurrentPercentage = Math.round(
		(lightningBalance / totalBalance) * 100,
	);

	const isTransferringToSavings = spendingAmount < lightningBalance;

	const selectedNetwork = useSelector(selectedNetworkSelector);
	const orders = useSelector(blocktankOrdersSelector);
	const order = useMemo(() => {
		return orders.find((o) => o.id === orderId);
	}, [orderId, orders]);

	const feeSat = order?.feeSat ?? 0;
	const blocktankPurchaseFee = useDisplayValues(feeSat);
	const transactionFee = useSelector(transactionFeeSelector);
	const fiatTransactionFee = useDisplayValues(transactionFee);
	const clientBalance = useDisplayValues(order?.clientBalanceSat ?? 0);

	const channelOpenCost = useMemo(() => {
		return (
			blocktankPurchaseFee.fiatValue -
			clientBalance.fiatValue +
			fiatTransactionFee.fiatValue
		).toFixed(2);
	}, [
		blocktankPurchaseFee.fiatValue,
		clientBalance.fiatValue,
		fiatTransactionFee.fiatValue,
	]);

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
			navigation.navigate('Success', { type: 'spending' });
		} else {
			setLoading(false);
			// spending -> savings
			navigation.navigate('Availability');
		}
	};

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer_funds')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root} testID="TransferConfirm">
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

				<View style={styles.chartContainer}>
					<View style={styles.chart}>
						<PieChart
							size={PIE_SIZE}
							shift={PIE_SHIFT}
							primary={spendingPercentage}
							dashed={spendingCurrentPercentage}
						/>
					</View>
					<View>
						<Percentage
							style={styles.percentage}
							value={spendingPercentage}
							type="spending"
						/>
						<Percentage
							style={styles.percentage}
							value={savingsPercentage}
							type="savings"
						/>
					</View>
				</View>

				<View style={styles.amount}>
					<Caption13Up style={styles.amountCaption} color="purple">
						{t('spending_label')}
					</Caption13Up>
					<AmountToggle sats={spendingAmount} secondaryFont="text01m" />
				</View>

				<SwipeToConfirm
					text={t('transfer_swipe')}
					color="purple"
					icon={<LightningIcon width={30} height={30} color="black" />}
					loading={loading}
					confirmed={loading}
					onConfirm={handleConfirm}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
		marginBottom: 62,
	},
	chartContainer: {
		// flex: 1,
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
	percentage: {
		marginVertical: 8,
	},
	amount: {
		marginTop: 'auto',
		marginBottom: 16,
	},
	amountCaption: {
		marginBottom: 4,
	},
});

export default Confirm;
