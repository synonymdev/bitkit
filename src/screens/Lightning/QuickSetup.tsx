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
import NumberPadTextField from '../../components/NumberPadTextField';
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
import { getNumberPadText } from '../../utils/numberpad';
import { getFiatDisplayValues } from '../../utils/displayValues';
import type { LightningScreenProps } from '../../navigation/types';
import { lnSetupSelector } from '../../store/reselect/aggregations';
import { blocktankInfoSelector } from '../../store/reselect/blocktank';
import {
	conversionUnitSelector,
	denominationSelector,
	nextUnitSelector,
	unitSelector,
} from '../../store/reselect/settings';

const QuickSetup = ({
	navigation,
}: LightningScreenProps<'QuickSetup'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const switchUnit = useSwitchUnit();
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const blocktankInfo = useAppSelector(blocktankInfoSelector);

	const [loading, setLoading] = useState(false);
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [textFieldValue, setTextFieldValue] = useState('');

	const max0ConfClientBalance = blocktankInfo.options.max0ConfClientBalanceSat;

	useFocusEffect(
		useCallback(() => {
			const setupTransfer = async (): Promise<void> => {
				await resetSendTransaction();
				await setupOnChainTransaction();
				refreshBlocktankInfo().then();
			};
			setupTransfer();
		}, []),
	);

	const spendingAmount = useMemo((): number => {
		return convertToSats(textFieldValue, conversionUnit);
	}, [textFieldValue, conversionUnit]);

	const lnSetup = useAppSelector((state) => {
		return lnSetupSelector(state, spendingAmount);
	});

	const btSpendingLimitBalancedUsd = useMemo((): string => {
		const { fiatWhole } = getFiatDisplayValues({
			satoshis: lnSetup.limits.lsp,
			currency: 'USD',
		});

		return fiatWhole;
	}, [lnSetup.limits.lsp]);

	const setInitialClientBalance = useCallback(() => {
		const value = lnSetup.initialClientBalance;
		const result = getNumberPadText(value, denomination, unit);
		setTextFieldValue(result);
	}, [lnSetup.initialClientBalance, denomination, unit]);

	const onMax = useCallback(() => {
		const result = getNumberPadText(
			lnSetup.slider.maxValue,
			denomination,
			unit,
		);
		setTextFieldValue(result);
	}, [lnSetup.slider.maxValue, denomination, unit]);

	useEffect(() => {
		setInitialClientBalance();
	}, [setInitialClientBalance, unit]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(spendingAmount, denomination, nextUnit);
		setTextFieldValue(result);
		switchUnit();
	};

	const onSliderChange = useCallback(
		(value: number) => {
			const result = getNumberPadText(Math.round(value), denomination, unit);
			setTextFieldValue(result);
		},
		[denomination, unit],
	);

	const onCustomAmount = (): void => {
		setShowNumberPad(true);
		setTextFieldValue('0');
	};

	const onDone = useCallback(() => {
		setShowNumberPad(false);
	}, []);

	const onContinue = useCallback(async (): Promise<void> => {
		const { clientBalance, lspBalance } = lnSetup;

		setLoading(true);

		const purchaseResponse = await startChannelPurchase({
			clientBalance,
			lspBalance,
			lspNodeId: blocktankInfo.nodes[0].pubkey,
			zeroConfPayment: clientBalance <= max0ConfClientBalance,
		});

		setLoading(false);
		if (purchaseResponse.isErr()) {
			showToast({
				type: 'warning',
				title: t('error_channel_purchase'),
				description: purchaseResponse.error.message,
			});
		}
		if (purchaseResponse.isOk()) {
			navigation.push('QuickConfirm', {
				spendingAmount,
				orderId: purchaseResponse.value.id,
			});
		}
	}, [
		lnSetup,
		blocktankInfo.nodes,
		max0ConfClientBalance,
		spendingAmount,
		navigation,
		t,
	]);

	const showMaxSpendingNote = spendingAmount >= lnSetup.limits.local;
	const showLspLimitNote = spendingAmount >= Math.round(lnSetup.limits.lsp);

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

						{showLspLimitNote && (
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

						{showMaxSpendingNote && !showLspLimitNote && (
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
								onPress={onCustomAmount}
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
