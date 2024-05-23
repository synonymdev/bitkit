import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up, Display, BodyMB, BodyM } from '../../styles/text';
import { View as ThemedView } from '../../styles/components';
import { LightningIcon } from '../../styles/icons';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import Percentage from '../../components/Percentage';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import Money from '../../components/Money';
import PieChart from './PieChart';
import { useBalance } from '../../hooks/wallet';
import { useAppSelector } from '../../hooks/redux';
import { useCurrency, useDisplayValues } from '../../hooks/displayValues';
import type { LightningScreenProps } from '../../navigation/types';
import { confirmChannelPurchase } from '../../store/utils/blocktank';
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
	const { onchainBalance, lightningBalance } = useBalance();
	const { t } = useTranslation('lightning');
	const orders = useAppSelector(blocktankOrdersSelector);
	const transactionFee = useAppSelector(transactionFeeSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const [loading, setLoading] = useState(false);

	const order = useMemo(() => {
		return orders.find((o) => o.id === orderId);
	}, [orderId, orders]);

	const { fiatSymbol } = useCurrency();
	const purchaseFee = useMemo(() => order?.feeSat ?? 0, [order]);
	const purchaseFeeValue = useDisplayValues(purchaseFee);
	const fiatTransactionFee = useDisplayValues(transactionFee);
	const clientBalance = useDisplayValues(order?.clientBalanceSat ?? 0);

	const isTransferToSavings = spendingAmount < lightningBalance;
	const txFee = fiatTransactionFee.fiatValue;
	const lspFee = purchaseFeeValue.fiatValue - clientBalance.fiatValue;

	const savingsAmount = onchainBalance - spendingAmount;
	const spendingPercentage = Math.round(
		(spendingAmount / onchainBalance) * 100,
	);
	const savingsPercentage = Math.round((savingsAmount / onchainBalance) * 100);

	const handleConfirm = async (): Promise<void> => {
		setLoading(true);

		if (order) {
			// savings -> spending
			setLoading(true);
			const res = await confirmChannelPurchase({ order, selectedNetwork });
			if (res.isErr()) {
				setLoading(false);
				return;
			}
			setLoading(false);
			navigation.navigate('SettingUp');
		} else {
			setLoading(false);
			// spending -> savings
			navigation.navigate('Availability');
		}
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content} testID="Confirm">
				<Display>
					<Trans
						t={t}
						i18nKey={'quick_confirm_header'}
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
				<BodyM style={styles.text} color="secondary">
					{isTransferToSavings ? (
						t('transfer_close')
					) : (
						<Trans
							t={t}
							i18nKey="quick_confirm_cost"
							components={{ accent: <BodyMB color="white" /> }}
							values={{
								txFee: `${fiatSymbol}${txFee.toFixed(2)}`,
								lspFee: `${fiatSymbol}${lspFee.toFixed(2)}`,
							}}
						/>
					)}
				</BodyM>

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

				<View style={styles.amountContainer}>
					<Caption13Up style={styles.amountCaption} color="purple">
						{t('spending_label')}
					</Caption13Up>
					<Money sats={spendingAmount} size="displayT" symbol={true} />
				</View>

				<SwipeToConfirm
					text={t('transfer.swipe')}
					color="purple"
					icon={<LightningIcon width={30} height={30} color="black" />}
					loading={loading}
					confirmed={loading}
					onConfirm={handleConfirm}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
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
	percentage: {
		marginVertical: 8,
	},
	amountContainer: {
		marginTop: 'auto',
		marginBottom: 26,
	},
	amountCaption: {
		marginBottom: 16,
	},
});

export default QuickConfirm;
