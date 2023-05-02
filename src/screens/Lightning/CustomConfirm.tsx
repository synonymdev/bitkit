import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Caption13Up, Display, Text01S, Text01M } from '../../styles/text';
import { LightningIcon, PencileIcon } from '../../styles/icons';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import AmountToggle from '../../components/AmountToggle';
import useDisplayValues from '../../hooks/displayValues';
import NumberPadWeeks from './NumberPadWeeks';
import { LightningScreenProps } from '../../navigation/types';
import { sleep } from '../../utils/helpers';
import Store from '../../store/types';
import {
	confirmChannelPurchase,
	startChannelPurchase,
} from '../../store/actions/blocktank';
import { showErrorNotification } from '../../utils/notifications';
import { addTodo } from '../../store/actions/todos';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionFeeSelector,
} from '../../store/reselect/wallet';
import {
	blocktankOrderSelector,
	blocktankServiceSelector,
} from '../../store/reselect/blocktank';

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
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const blocktankService = useSelector(blocktankServiceSelector);
	const order = useSelector((state: Store) => {
		return blocktankOrderSelector(state, orderId);
	});

	const blocktankPurchaseFee = useDisplayValues(order?.price ?? 0);
	const transactionFee = useSelector(transactionFeeSelector);
	const fiatTransactionFee = useDisplayValues(transactionFee);
	const channelOpenCost = useMemo(() => {
		return (
			blocktankPurchaseFee.fiatValue + fiatTransactionFee.fiatValue
		).toFixed(2);
	}, [fiatTransactionFee.fiatValue, blocktankPurchaseFee.fiatValue]);

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

	const updateOrderExpiration = async (): Promise<void> => {
		const purchaseResponse = await startChannelPurchase({
			productId: blocktankService.product_id,
			remoteBalance: order.remote_balance,
			localBalance: order.local_balance,
			channelExpiry: Math.max(weeks, 1),
			selectedWallet,
			selectedNetwork,
		});
		if (purchaseResponse.isErr()) {
			showErrorNotification({
				title: t('error_channel_purchase'),
				message: purchaseResponse.error.message,
			});
			return;
		}
		setOrderId(purchaseResponse.value.orderId);
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
								components={{
									purple: <Display color="purple" />,
								}}
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
									amount: `${blocktankPurchaseFee.fiatSymbol}${channelOpenCost}`,
									weeks,
								}}
							/>
						</Text01S>

						<View style={styles.block}>
							<Caption13Up color="purple" style={styles.space}>
								{t('spending_label')}
							</Caption13Up>
							<AmountToggle sats={spendingAmount} />
						</View>

						<View style={styles.block}>
							<Caption13Up color="purple" style={styles.space}>
								{t('receiving_label')}
							</Caption13Up>
							<AmountToggle sats={receivingAmount} />
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
						<Display>{weeks}</Display>
						<Text01M style={styles.text} color="gray1">
							{t('duration_week', { count: weeks })}
						</Text01M>
					</AnimatedView>
				)}

				{showNumberPad && (
					<NumberPadWeeks
						style={styles.numberpad}
						weeks={weeks}
						onChange={setWeeks}
						onDone={(): void => {
							if (order.channel_expiry !== weeks) {
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
		marginBottom: 40,
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
