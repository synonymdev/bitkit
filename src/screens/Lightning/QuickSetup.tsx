import React, {
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
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
import { useAppSelector } from '../../hooks/redux';
import { useSwitchUnit } from '../../hooks/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import {
	refreshBlocktankInfo,
	startChannelPurchase,
} from '../../store/utils/blocktank';
import { showToast } from '../../utils/notifications';
import { convertToSats } from '../../utils/conversion';
import { getFiatDisplayValues } from '../../utils/displayValues';
import { LIGHTNING_DIFF } from '../../utils/wallet/constants';
import type { LightningScreenProps } from '../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { blocktankInfoSelector } from '../../store/reselect/blocktank';
import { primaryUnitSelector } from '../../store/reselect/settings';
import { lnSetupSelector } from '../../store/reselect/aggregations';
import NumberPadTextField from '../../components/NumberPadTextField';
import { getNumberPadText } from '../../utils/numberpad';
import { DEFAULT_CHANNEL_DURATION } from './CustomConfirm';

const QuickSetup = ({
	navigation,
}: LightningScreenProps<'QuickSetup'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const [nextUnit, onSwitchUnit] = useSwitchUnit();
	const unit = useAppSelector(primaryUnitSelector);
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const blocktankInfo = useAppSelector(blocktankInfoSelector);

	const [loading, setLoading] = useState(false);
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [textFieldValue, setTextFieldValue] = useState('');

	useFocusEffect(
		useCallback(() => {
			resetSendTransaction().then(() => {
				setupOnChainTransaction().then();
			});
			refreshBlocktankInfo().then();
		}, []),
	);

	const spendingAmount = useMemo((): number => {
		return convertToSats(textFieldValue, unit);
	}, [textFieldValue, unit]);

	const lnSetup = useAppSelector((state) =>
		lnSetupSelector(state, spendingAmount),
	);

	const btSpendingLimitBalancedUsd = useMemo((): string => {
		const { fiatWhole } = getFiatDisplayValues({
			satoshis: lnSetup.btSpendingLimitBalanced,
			currency: 'USD',
		});

		return fiatWhole;
	}, [lnSetup.btSpendingLimitBalanced]);

	const setDefaultClientBalance = useCallback(() => {
		const value = lnSetup.defaultClientBalance;
		const result = getNumberPadText(value, unit);
		setTextFieldValue(result);
	}, [lnSetup.defaultClientBalance, unit]);

	const onMax = useCallback(() => {
		const result = getNumberPadText(lnSetup.slider.maxValue, unit);
		setTextFieldValue(result);
	}, [lnSetup.slider.maxValue, unit]);

	useEffect(() => {
		setDefaultClientBalance();
	}, [setDefaultClientBalance, unit]);

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

	const onDone = useCallback(() => {
		setShowNumberPad(false);
	}, []);

	const onContinue = useCallback(async (): Promise<void> => {
		setLoading(true);

		const maxUsableLspBalance = Math.round(
			blocktankInfo.options.maxChannelSizeSat - spendingAmount,
		);
		const minUsableLspBalance = Math.round(maxUsableLspBalance / 3);
		let lspBalance = Math.max(
			Math.round(spendingAmount + spendingAmount * LIGHTNING_DIFF),
			minUsableLspBalance,
		);
		const purchaseResponse = await startChannelPurchase({
			selectedNetwork,
			selectedWallet,
			remoteBalance: spendingAmount!,
			localBalance: lspBalance,
			channelExpiry: DEFAULT_CHANNEL_DURATION,
			lspNodeId: blocktankInfo.nodes[0].pubkey,
			zeroConfPayment:
				spendingAmount <= blocktankInfo.options.max0ConfClientBalanceSat,
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
				orderId: purchaseResponse.value.order.id,
			});
		}
	}, [
		blocktankInfo,
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
									startValue={lnSetup.slider.startValue}
									endValue={lnSetup.slider.endValue}
									maxValue={lnSetup.slider.maxValue}
									onValueChange={onSliderChange}
								/>
							</View>
							<View style={styles.percentages}>
								<Percentage
									value={lnSetup.percentage.spendings}
									type="spending"
								/>
								<Percentage value={lnSetup.percentage.savings} type="savings" />
							</View>
						</AnimatedView>

						{spendingAmount >= Math.round(lnSetup.btSpendingLimitBalanced) && (
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

						{spendingAmount >= lnSetup.spendableBalance && (
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
							disabled={!lnSetup.canContinue}
							testID="QuickSetupContinue"
							onPress={onContinue}
						/>
					</AnimatedView>
				)}

				{showNumberPad && (
					<NumberPadLightning
						style={styles.numberpad}
						value={textFieldValue}
						maxAmount={lnSetup.slider.maxValue}
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
