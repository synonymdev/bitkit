import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Caption13Up, Display, Text01S } from '../../styles/text';
import { LightningIcon, PencileIcon } from '../../styles/icons';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import AmountToggle from '../../components/AmountToggle';
import { useAppSelector } from '../../hooks/redux';
import useDisplayValues, { useCurrency } from '../../hooks/displayValues';
import NumberPadWeeks from './NumberPadWeeks';
import { LightningScreenProps } from '../../navigation/types';
import { sleep } from '../../utils/helpers';
import { blocktankOrderSelector } from '../../store/reselect/blocktank';
import {
	confirmChannelPurchase,
	startChannelPurchase,
} from '../../store/utils/blocktank';
import { showToast } from '../../utils/notifications';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionFeeSelector,
} from '../../store/reselect/wallet';

export const DEFAULT_CHANNEL_DURATION = 6;

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
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const order = useAppSelector((state) => {
		return blocktankOrderSelector(state, orderId);
	});

	const { fiatSymbol } = useCurrency();
	const purchaseFee = useMemo(() => order?.feeSat ?? 0, [order]);
	const purchaseFeeValue = useDisplayValues(purchaseFee);
	const fiatTransactionFee = useDisplayValues(transactionFee);
	const clientBalance = useDisplayValues(order?.clientBalanceSat ?? 0);

	// avoid flashing different price after confirmation
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const txFee = useMemo(() => fiatTransactionFee.fiatValue, [orderId]);
	const lspFee = purchaseFeeValue.fiatValue - clientBalance.fiatValue;

	const handleConfirm = async (): Promise<void> => {
		setLoading(true);
		await sleep(5);
		const res = await confirmChannelPurchase({ orderId, selectedNetwork });
		if (res.isErr()) {
			setLoading(false);
			return;
		}
		const zeroConf = order.zeroConf && !res.value.useUnconfirmedInputs;
		navigation.navigate(zeroConf ? 'SettingUp' : 'Success');
	};

	const updateOrderExpiration = async (): Promise<void> => {
		const purchaseResponse = await startChannelPurchase({
			remoteBalance: order.clientBalanceSat,
			localBalance: order.lspBalanceSat,
			channelExpiry: Math.max(weeks, 1),
			turboChannel: order.zeroConf,
			selectedWallet,
			selectedNetwork,
		});
		if (purchaseResponse.isErr()) {
			showToast({
				type: 'error',
				title: t('error_channel_purchase'),
				description: purchaseResponse.error.message,
			});
			return;
		}
		setOrderId(purchaseResponse.value.order.id);
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
			<View style={styles.root} testID="CustomConfirm">
				{!showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Display>
							<Trans
								t={t}
								i18nKey="custom_confirm_header"
								components={{ purple: <Display color="purple" /> }}
							/>
						</Display>
						<Text01S color="gray1" style={styles.text}>
							<Trans
								t={t}
								i18nKey="custom_confirm_cost"
								components={{
									white: <Text01S color="white" />,
									whiteWithKeyboard: (
										<Text01S
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
						</Text01S>

						<View style={styles.block}>
							<Caption13Up color="purple" style={styles.space}>
								{t('spending_label')}
							</Caption13Up>
							<AmountToggle sats={spendingAmount} secondaryFont="text01m" />
						</View>

						<View style={styles.block}>
							<Caption13Up color="purple" style={styles.space}>
								{t('receiving_label')}
							</Caption13Up>
							<AmountToggle sats={receivingAmount} secondaryFont="text01m" />
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
							text={t('connect_swipe')}
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
						<Display color="purple">{t('duration_header')}</Display>
						<Text01S style={styles.text} color="gray1">
							{t('duration_text')}
						</Text01S>
					</AnimatedView>
				)}

				{showNumberPad && (
					<AnimatedView
						style={styles.weeks}
						color="transparent"
						entering={FadeIn}
						exiting={FadeOut}>
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
		marginBottom: 16,
	},
	space: {
		marginBottom: 8,
		alignItems: 'center',
	},
	block: {
		marginBottom: 32,
	},
	weeks: {
		alignSelf: 'flex-start',
		alignItems: 'center',
	},
	buttonContainer: {
		marginTop: 'auto',
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default CustomConfirm;
