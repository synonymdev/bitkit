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
import PieChart from './PieChart';
import { sleep } from '../../utils/helpers';
import { useBalance } from '../../hooks/wallet';
import useDisplayValues from '../../hooks/displayValues';
import type { LightningScreenProps } from '../../navigation/types';
import { addTodo } from '../../store/actions/todos';
import { confirmChannelPurchase } from '../../store/actions/blocktank';
import { blocktankOrdersSelector } from '../../store/reselect/blocktank';
import {
	selectedNetworkSelector,
	transactionFeeSelector,
} from '../../store/reselect/wallet';

const PIE_SIZE = 140;
const PIE_SHIFT = 70;

const QuickConfirm = ({
	navigation,
	route,
}: LightningScreenProps<'QuickConfirm'>): ReactElement => {
	const { spendingAmount, orderId } = route.params;
	const { t } = useTranslation('lightning');
	const [loading, setLoading] = useState(false);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const { satoshis: onchainBalance } = useBalance({ onchain: true });
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
	}, [fiatTransactionFee.fiatValue, blocktankPurchaseFee.fiatValue]);

	const savingsAmount = onchainBalance - spendingAmount;
	const spendingPercentage = Math.round(
		(spendingAmount / onchainBalance) * 100,
	);
	const savingsPercentage = Math.round((savingsAmount / onchainBalance) * 100);

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
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('add_instant_payments')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root} testID="QuickConfirm">
				<Display color="purple">{t('quick_confirm_header')}</Display>
				<Text01S style={styles.text} color="gray1">
					<Trans
						t={t}
						i18nKey="quick_confirm_cost"
						components={{
							white: <Text01S color="white" />,
						}}
						values={{
							amount: `${blocktankPurchaseFee.fiatSymbol}${channelOpenCost}`,
						}}
					/>
				</Text01S>

				<View style={styles.chartContainer}>
					<View style={styles.chart}>
						<PieChart
							size={PIE_SIZE}
							shift={PIE_SHIFT}
							primary={spendingPercentage}
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
					<AmountToggle sats={spendingAmount} />
				</View>

				<SwipeToConfirm
					text={t('connect_swipe')}
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

export default QuickConfirm;
