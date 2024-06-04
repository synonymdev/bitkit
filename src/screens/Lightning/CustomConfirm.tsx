import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView, AnimatedView } from '../../styles/components';
import { Caption13Up, Display, BodyMB, BodyM } from '../../styles/text';
import { LightningIcon, PencileIcon } from '../../styles/icons';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import Money from '../../components/Money';
import { useAppSelector } from '../../hooks/redux';
import { useCurrency, useDisplayValues } from '../../hooks/displayValues';
import NumberPadWeeks from './NumberPadWeeks';
import { LightningScreenProps } from '../../navigation/types';
import { sleep } from '../../utils/helpers';
import {
	blocktankInfoSelector,
	blocktankOrderSelector,
} from '../../store/reselect/blocktank';
import {
	confirmChannelPurchase,
	startChannelPurchase,
} from '../../store/utils/blocktank';
import { showToast } from '../../utils/notifications';
import { DEFAULT_CHANNEL_DURATION } from '../../utils/wallet/constants';
import {
	selectedNetworkSelector,
	transactionFeeSelector,
} from '../../store/reselect/wallet';

const CustomConfirm = ({
	navigation,
	route,
}: LightningScreenProps<'CustomConfirm'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { spendingAmount, receivingAmount } = route.params;
	const [weeks, setWeeks] = useState(DEFAULT_CHANNEL_DURATION);
	const [loading, setLoading] = useState(false);
	const [orderId, setOrderId] = useState(route.params.orderId);
	const [showNumberPad, setShowNumberPad] = useState(false);
	const transactionFee = useAppSelector(transactionFeeSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const blocktankInfo = useAppSelector(blocktankInfoSelector);
	const order = useAppSelector((state) => {
		return blocktankOrderSelector(state, orderId);
	});

	const { fiatSymbol } = useCurrency();
	const purchaseFee = useMemo(() => order?.feeSat ?? 0, [order]);
	const purchaseFeeValue = useDisplayValues(purchaseFee);
	const fiatTransactionFee = useDisplayValues(transactionFee);
	const clientBalance = useDisplayValues(order?.clientBalanceSat ?? 0);

	const txFee = fiatTransactionFee.fiatValue;
	const lspFee = purchaseFeeValue.fiatValue - clientBalance.fiatValue;

	const handleConfirm = async (): Promise<void> => {
		if (!order) {
			return;
		}
		setLoading(true);
		await sleep(5);
		const res = await confirmChannelPurchase({ order, selectedNetwork });
		if (res.isErr()) {
			setLoading(false);
			return;
		}
		navigation.navigate('SettingUp');
	};

	const updateOrderExpiration = async (): Promise<void> => {
		const { max0ConfClientBalanceSat, minExpiryWeeks } = blocktankInfo.options;
		const purchaseResponse = await startChannelPurchase({
			clientBalance: order.clientBalanceSat,
			lspBalance: order.lspBalanceSat,
			channelExpiryWeeks: Math.max(weeks, minExpiryWeeks),
			zeroConfPayment: order.clientBalanceSat <= max0ConfClientBalanceSat,
		});
		if (purchaseResponse.isErr()) {
			showToast({
				type: 'warning',
				title: t('error_channel_purchase'),
				description: t('error_channel_setup_msg', {
					raw: purchaseResponse.error.message,
				}),
			});
			return;
		}
		setOrderId(purchaseResponse.value.id);
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<View style={styles.content} testID="CustomConfirm">
				{!showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Display>
							<Trans
								t={t}
								i18nKey={'custom_confirm_header'}
								components={{ accent: <Display color="purple" /> }}
							/>
						</Display>
						<BodyM color="secondary" style={styles.text}>
							<Trans
								t={t}
								i18nKey="custom_confirm_cost"
								components={{
									accent: <BodyMB color="white" />,
									accentWithKeyboard: (
										<BodyMB
											color="white"
											testID="CustomConfirmWeeks"
											onPress={(): void => setShowNumberPad(true)}
										/>
									),
									penIcon: <PencileIcon height={16} width={13} />,
								}}
								values={{
									txFee: `${fiatSymbol}${txFee.toFixed(2)}`,
									lspFee: `${fiatSymbol}${lspFee.toFixed(2)}`,
									weeks,
								}}
							/>
						</BodyM>

						<View style={styles.balance}>
							<Caption13Up style={styles.balanceLabel} color="purple">
								{t('spending_label')}
							</Caption13Up>
							<Money sats={spendingAmount} size="displayT" symbol={true} />
						</View>

						<View style={styles.balance}>
							<Caption13Up style={styles.balanceLabel} color="purple">
								{t('receiving_label')}
							</Caption13Up>
							<Money sats={receivingAmount} size="displayT" symbol={true} />
						</View>
					</AnimatedView>
				)}

				{!showNumberPad && (
					<AnimatedView
						style={styles.buttonContainer}
						color="transparent"
						entering={FadeIn}
						exiting={FadeOut}>
						<SwipeToConfirm
							text={t('transfer.swipe')}
							color="purple"
							onConfirm={handleConfirm}
							icon={<LightningIcon width={30} height={30} color="black" />}
							loading={loading}
							confirmed={loading}
						/>
					</AnimatedView>
				)}

				{showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Display>
							<Trans
								t={t}
								i18nKey="duration_header"
								components={{ accent: <Display color="purple" /> }}
							/>
						</Display>
						<BodyM style={styles.text} color="secondary">
							{t('duration_text')}
						</BodyM>
					</AnimatedView>
				)}

				{showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Caption13Up style={styles.text} color="purple">
							{t('duration_week', { count: weeks })}
						</Caption13Up>
						<Display>{weeks}</Display>
					</AnimatedView>
				)}

				{showNumberPad && (
					<NumberPadWeeks
						style={styles.numberpad}
						weeks={weeks}
						onChange={setWeeks}
						onDone={(): void => {
							if (order.channelExpiryWeeks !== weeks) {
								updateOrderExpiration().then();
							}
							setShowNumberPad(false);
						}}
					/>
				)}
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
	balanceLabel: {
		marginBottom: 16,
	},
	balance: {
		marginBottom: 32,
	},
	buttonContainer: {
		marginTop: 'auto',
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default CustomConfirm;
