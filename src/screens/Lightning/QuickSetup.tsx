import React, {
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Caption13Up, Display, Text01S, Text02S } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Percentage from '../../components/Percentage';
import Button from '../../components/Button';
import FancySlider from '../../components/FancySlider';
import NumberPadLightning from './NumberPadLightning';
import { useBalance, useSwitchUnit } from '../../hooks/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import {
	refreshBlocktankInfo,
	startChannelPurchase,
} from '../../store/actions/blocktank';
import { showToast } from '../../utils/notifications';
import { convertToSats } from '../../utils/conversion';
import { getFiatDisplayValues } from '../../utils/displayValues';
import { SPENDING_LIMIT_RATIO } from '../../utils/wallet/constants';
import type { LightningScreenProps } from '../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { blocktankServiceSelector } from '../../store/reselect/blocktank';
import { primaryUnitSelector } from '../../store/reselect/settings';
import NumberPadTextField from '../../components/NumberPadTextField';
import { getNumberPadText } from '../../utils/numberpad';

const QuickSetup = ({
	navigation,
}: LightningScreenProps<'QuickSetup'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { onchainBalance } = useBalance();
	const [nextUnit, onSwitchUnit] = useSwitchUnit();
	const unit = useSelector(primaryUnitSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const blocktankService = useSelector(blocktankServiceSelector);

	const [loading, setLoading] = useState(false);
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [textFieldValue, setTextFieldValue] = useState('');

	useFocusEffect(
		useCallback(() => {
			resetSendTransaction({ selectedNetwork, selectedWallet });
			setupOnChainTransaction({ selectedNetwork, selectedWallet }).then();
			refreshBlocktankInfo().then();
		}, [selectedNetwork, selectedWallet]),
	);

	// default spendingPercentage to 20%
	useEffect(() => {
		const defaultSpendingAmount = Math.round(onchainBalance * 0.2);
		const result = getNumberPadText(defaultSpendingAmount, unit);
		setTextFieldValue(result);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onchainBalance]);

	const spendingAmount = useMemo((): number => {
		return convertToSats(textFieldValue, unit);
	}, [textFieldValue, unit]);

	const diff = 0.01;
	const btSpendingLimit = blocktankService.max_chan_spending;
	const btSpendingLimitBalanced = Math.round(
		btSpendingLimit / 2 - btSpendingLimit * diff,
	);
	const spendableBalance = Math.round(onchainBalance * SPENDING_LIMIT_RATIO);
	const savingsAmount = onchainBalance - spendingAmount;
	const savingsPercentage = Math.round((savingsAmount / onchainBalance) * 100);
	const spendingPercentage = Math.round(
		(spendingAmount / onchainBalance) * 100,
	);

	const spendingLimit = useMemo(() => {
		return Math.min(spendableBalance, btSpendingLimitBalanced);
	}, [spendableBalance, btSpendingLimitBalanced]);

	const btSpendingLimitBalancedUsd = useMemo((): string => {
		const { fiatWhole } = getFiatDisplayValues({
			satoshis: btSpendingLimitBalanced,
			currency: 'USD',
		});

		return fiatWhole;
	}, [btSpendingLimitBalanced]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(spendingAmount, nextUnit);
		setTextFieldValue(result);
		onSwitchUnit();
	};

	const onSliderChange = useCallback(
		(value: number) => {
			const result = getNumberPadText(Math.round(value), unit);
			setTextFieldValue(result);
		},
		[unit],
	);

	const onMax = useCallback(() => {
		const result = getNumberPadText(spendingLimit, unit);
		setTextFieldValue(result);
	}, [spendingLimit, unit]);

	const onDone = useCallback(() => {
		setShowNumberPad(false);
	}, []);

	const onContinue = useCallback(async (): Promise<void> => {
		setLoading(true);

		// Ensure local balance is bigger than remote balance
		const localBalance = Math.max(
			Math.round(spendingAmount + spendingAmount * diff),
			blocktankService.min_channel_size,
		);
		const purchaseResponse = await startChannelPurchase({
			selectedNetwork,
			selectedWallet,
			productId: blocktankService.product_id,
			remoteBalance: spendingAmount,
			localBalance,
			channelExpiry: 12,
		});

		setLoading(false);
		if (purchaseResponse.isErr()) {
			showToast({
				type: 'error',
				title: t('error_channel_purchase'),
				description: purchaseResponse.error.message,
			});
		}
		if (purchaseResponse.isOk()) {
			navigation.push('QuickConfirm', {
				spendingAmount: spendingAmount,
				orderId: purchaseResponse.value.orderId,
			});
		}
	}, [
		spendingAmount,
		blocktankService,
		selectedNetwork,
		selectedWallet,
		navigation,
		t,
	]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('add_instant_payments')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root} testID="QuickSetup">
				<Display color="purple">
					{t(showNumberPad ? 'spending_money' : 'spending_balance')}
				</Display>
				<Text01S color="gray1" style={styles.text}>
					{t(showNumberPad ? 'enter_money' : 'enter_amount')}
				</Text01S>

				{!showNumberPad && (
					<>
						<AnimatedView
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<View style={styles.row}>
								<Caption13Up color="purple">{t('spending')}</Caption13Up>
								<Caption13Up color="orange">{t('savings')}</Caption13Up>
							</View>
							<View style={styles.sliderContainer}>
								<FancySlider
									value={spendingAmount}
									startValue={0}
									endValue={onchainBalance}
									maxValue={spendingLimit}
									onValueChange={onSliderChange}
								/>
							</View>
							<View style={styles.percentages}>
								<Percentage value={spendingPercentage} type="spending" />
								<Percentage value={savingsPercentage} type="savings" />
							</View>
						</AnimatedView>

						{spendingAmount === Math.round(btSpendingLimitBalanced) && (
							<AnimatedView
								style={styles.note}
								entering={FadeIn}
								exiting={FadeOut}
								testID="QuickSetupBlocktankNote">
								<Text02S color="gray1">
									{t('note_blocktank_limit', {
										usdValue: btSpendingLimitBalancedUsd,
									})}
								</Text02S>
							</AnimatedView>
						)}

						{spendingAmount === spendableBalance && (
							<AnimatedView
								style={styles.note}
								entering={FadeIn}
								exiting={FadeOut}
								testID="QuickSetupReserveNote">
								<Text02S color="gray1">{t('note_reserve_limit')}</Text02S>
							</AnimatedView>
						)}

						<AnimatedView
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<Button
								style={styles.buttonCustom}
								text={t('enter_custom_amount')}
								testID="QuickSetupCustomAmount"
								onPress={(): void => setShowNumberPad(true)}
							/>
						</AnimatedView>
					</>
				)}

				<View style={styles.amount}>
					{!showNumberPad && (
						<Caption13Up style={styles.amountCaption} color="purple">
							{t('spending_label')}
						</Caption13Up>
					)}
					<NumberPadTextField
						value={textFieldValue}
						showPlaceholder={showNumberPad}
						reverse={true}
						onPress={onChangeUnit}
					/>
				</View>

				{!showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Button
							loading={loading}
							text={t('continue')}
							size="large"
							disabled={spendingAmount === 0}
							testID="QuickSetupContinue"
							onPress={onContinue}
						/>
					</AnimatedView>
				)}

				{showNumberPad && (
					<NumberPadLightning
						style={styles.numberpad}
						value={textFieldValue}
						maxAmount={spendingLimit}
						onChange={setTextFieldValue}
						onChangeUnit={onChangeUnit}
						onMax={onMax}
						onDone={onDone}
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
		marginBottom: 42,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginVertical: 4,
	},
	sliderContainer: {
		marginTop: 24,
		marginBottom: 16,
	},
	percentages: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	note: {
		marginTop: 16,
	},
	amount: {
		marginTop: 'auto',
		marginBottom: 32,
	},
	amountCaption: {
		marginBottom: 4,
	},
	numberpad: {
		marginHorizontal: -16,
	},
	buttonCustom: {
		marginTop: 16,
		alignSelf: 'flex-start',
	},
});

export default QuickSetup;
