import React, {
	ReactElement,
	useState,
	useCallback,
	useMemo,
	useEffect,
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
import NumberPadTextField from '../../components/NumberPadTextField';
import Button from '../../components/Button';
import Percentage from '../../components/Percentage';
import FancySlider from '../../components/FancySlider';
import NumberPadLightning from '../Lightning/NumberPadLightning';
import { useBalance, useSwitchUnit } from '../../hooks/wallet';
import {
	refreshBlocktankInfo,
	startChannelPurchase,
} from '../../store/actions/blocktank';
import { convertToSats } from '../../utils/conversion';
import { getNumberPadText } from '../../utils/numberpad';
import { SPENDING_LIMIT_RATIO } from '../../utils/wallet/constants';
import { showToast } from '../../utils/notifications';
import { getFiatDisplayValues } from '../../utils/displayValues';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import type { TransferScreenProps } from '../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { primaryUnitSelector } from '../../store/reselect/settings';
import { blocktankServiceSelector } from '../../store/reselect/blocktank';

const Setup = ({ navigation }: TransferScreenProps<'Setup'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const [nextUnit, switchUnit] = useSwitchUnit();
	const { totalBalance, lightningBalance } = useBalance();

	const [textFieldValue, setTextFieldValue] = useState('');
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [loading, setLoading] = useState(false);
	const unit = useSelector(primaryUnitSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const blocktankService = useSelector(blocktankServiceSelector);

	useFocusEffect(
		useCallback(() => {
			resetSendTransaction({ selectedNetwork, selectedWallet });
			setupOnChainTransaction({ selectedNetwork, selectedWallet }).then();
			refreshBlocktankInfo().then();
		}, [selectedNetwork, selectedWallet]),
	);

	const spendingAmount = useMemo((): number => {
		return convertToSats(textFieldValue, unit);
	}, [textFieldValue, unit]);

	const diff = 0.01;
	const btSpendingLimit = blocktankService.max_chan_spending;
	const btSpendingLimitBalanced = Math.round(
		btSpendingLimit / 2 - btSpendingLimit * diff,
	);
	const spendableBalance = Math.round(totalBalance * SPENDING_LIMIT_RATIO);
	const savingsAmount = totalBalance - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / totalBalance) * 100);
	const savingsPercentage = Math.round((savingsAmount / totalBalance) * 100);
	const isTransferringToSavings = spendingAmount < lightningBalance;
	const isButtonDisabled = spendingAmount === lightningBalance;

	const spendingLimit = useMemo(() => {
		const min = Math.min(spendableBalance, btSpendingLimitBalanced);
		return min < lightningBalance ? lightningBalance : min;
	}, [spendableBalance, btSpendingLimitBalanced, lightningBalance]);

	const btSpendingLimitBalancedUsd = useMemo((): string => {
		const { fiatWhole } = getFiatDisplayValues({
			satoshis: btSpendingLimitBalanced,
			currency: 'USD',
		});

		return fiatWhole;
	}, [btSpendingLimitBalanced]);

	// set initial value
	useEffect(() => {
		const result = getNumberPadText(lightningBalance, unit);
		setTextFieldValue(result);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lightningBalance]);

	const onSliderChange = useCallback(
		(value: number) => {
			const result = getNumberPadText(Math.round(value), unit);
			setTextFieldValue(result);
		},
		[unit],
	);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(spendingAmount, nextUnit);
		setTextFieldValue(result);
		switchUnit();
	};

	const onMax = useCallback(() => {
		const result = getNumberPadText(spendingLimit, unit);
		setTextFieldValue(result);
	}, [spendingLimit, unit]);

	const onDone = useCallback(() => {
		setShowNumberPad(false);
	}, []);

	const onContinue = useCallback(async (): Promise<void> => {
		if (isTransferringToSavings) {
			navigation.push('Confirm', {
				spendingAmount,
			});
			return;
		}

		// buy an additional channel from Blocktank with the difference
		setLoading(true);
		const remoteBalance = spendingAmount - lightningBalance;
		// Ensure local balance is bigger than remote balance
		const localBalance = Math.max(
			Math.round(remoteBalance + remoteBalance * diff),
			blocktankService.min_channel_size,
		);

		const purchaseResponse = await startChannelPurchase({
			selectedNetwork,
			selectedWallet,
			productId: blocktankService.product_id,
			remoteBalance,
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
			navigation.push('Confirm', {
				spendingAmount,
				orderId: purchaseResponse.value.orderId,
			});
		}
	}, [
		blocktankService,
		isTransferringToSavings,
		lightningBalance,
		spendingAmount,
		selectedNetwork,
		selectedWallet,
		navigation,
		t,
	]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer_funds')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root} testID="TransferSetup">
				<View>
					{showNumberPad ? (
						<>
							<Display color="purple">{t('transfer_header_keybrd')}</Display>
							<Text01S color="gray1" style={styles.text}>
								{t('enter_money')}
							</Text01S>
						</>
					) : (
						<>
							<Display color="purple">{t('transfer_header_nokeybrd')}</Display>
							<Text01S color="gray1" style={styles.text}>
								{t('enter_amount')}
							</Text01S>
							<AnimatedView
								style={styles.sliderSection}
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
										endValue={totalBalance}
										maxValue={spendingLimit}
										snapPoint={lightningBalance}
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
									exiting={FadeOut}>
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
									exiting={FadeOut}>
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
									onPress={(): void => setShowNumberPad(true)}
								/>
							</AnimatedView>
						</>
					)}
				</View>

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
							text={t('continue')}
							size="large"
							loading={loading}
							disabled={isButtonDisabled}
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
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginVertical: 4,
	},
	sliderSection: {
		marginTop: 42,
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

export default Setup;
