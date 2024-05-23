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
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView, AnimatedView } from '../../styles/components';
import { Caption13Up, Display, BodyM, BodyS } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import Percentage from '../../components/Percentage';
import Button from '../../components/Button';
import FancySlider from '../../components/FancySlider';
import TransferTextField from '../../components/TransferTextField';
import NumberPadLightning from './NumberPadLightning';
import { useAppSelector } from '../../hooks/redux';
import { useBalance, useSwitchUnit } from '../../hooks/wallet';
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
	const { lightningBalance } = useBalance();
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
			};
			setupTransfer();
		}, []),
	);

	// refresh BT info every 20 seconds, because minChannelSizeSat changes
	useFocusEffect(
		useCallback(() => {
			refreshBlocktankInfo().then();
			const interval = setInterval(() => {
				refreshBlocktankInfo().then();
			}, 20000);
			return (): void => clearInterval(interval);
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

	useEffect(() => {
		// set to initial client balance
		const value = lnSetup.slider.initialValue;
		const result = getNumberPadText(value, denomination, unit);
		setTextFieldValue(result);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lnSetup.slider.initialValue]);

	const onMax = useCallback(() => {
		const result = getNumberPadText(
			lnSetup.slider.maxValue,
			denomination,
			unit,
		);
		setTextFieldValue(result);
	}, [lnSetup.slider.maxValue, denomination, unit]);

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

	const onSwitch = (): void => {
		navigation.replace('CustomSetup', { spending: true });
	};

	const onContinue = useCallback(async (): Promise<void> => {
		const { clientBalance, lspBalance, isTransferringToSavings } = lnSetup;

		if (isTransferringToSavings) {
			navigation.navigate('QuickConfirm', { spendingAmount });
			return;
		}

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

	const title = showNumberPad
		? 'transfer.title_numpad'
		: 'transfer.title_slider';

	const text = showNumberPad
		? t('transfer.text_numpad')
		: t('transfer.text_slider');

	const showMaxSpendingNote = spendingAmount >= lnSetup.limits.local;
	const showLspLimitNote = spendingAmount >= Math.round(lnSetup.limits.lsp);
	const maxSpendingPercentage = Math.max(lnSetup.percentage.spending, 80);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content} testID="QuickSetup">
				<Display>
					<Trans
						t={t}
						i18nKey={title}
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
				<BodyM style={styles.text} color="white50">
					{text}
				</BodyM>

				{!showNumberPad && (
					<>
						<AnimatedView
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<View style={styles.row}>
								<Caption13Up color="purple">{t('spending')}</Caption13Up>
								<Caption13Up color="bitcoin">{t('savings')}</Caption13Up>
							</View>
							<View style={styles.sliderContainer}>
								<FancySlider
									value={spendingAmount}
									startValue={0}
									maxValue={lnSetup.slider.maxValue}
									endValue={lnSetup.slider.endValue}
									snapPoint={lnSetup.slider.snapPoint}
									onValueChange={onSliderChange}
								/>
							</View>
							<View style={styles.percentages}>
								<Percentage
									value={lnSetup.percentage.spending}
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
								<BodyS color="white50">
									{t('note_blocktank_limit', {
										usdValue: btSpendingLimitBalancedUsd,
									})}
								</BodyS>
							</AnimatedView>
						)}

						{showMaxSpendingNote && !showLspLimitNote && (
							<AnimatedView
								style={styles.note}
								entering={FadeIn}
								exiting={FadeOut}
								testID="QuickSetupReserveNote">
								<BodyS color="white50">
									{t('note_reserve_limit', {
										percentage: maxSpendingPercentage,
									})}
								</BodyS>
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

				<View style={styles.amountContainer}>
					{!showNumberPad && (
						<Caption13Up style={styles.amountCaption} color="purple">
							{t('spending_label')}
						</Caption13Up>
					)}
					<TransferTextField
						value={textFieldValue}
						showPlaceholder={showNumberPad}
						testID="QuickSetupTextField"
						onPress={onChangeUnit}
					/>
				</View>

				{!showNumberPad && (
					<AnimatedView
						style={styles.buttonContainer}
						color="transparent"
						entering={FadeIn}
						exiting={FadeOut}>
						<Button
							style={styles.button}
							text={t('advanced')}
							size="large"
							variant="secondary"
							testID="QuickSetupAdvanced"
							onPress={onSwitch}
						/>
						<Button
							style={styles.button}
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
						minAmount={lightningBalance}
						maxAmount={lnSetup.slider.maxValue}
						onChange={setTextFieldValue}
						onChangeUnit={onChangeUnit}
						onMax={onMax}
						onDone={onDone}
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
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginVertical: 4,
	},
	sliderContainer: {
		marginTop: 22,
		marginBottom: 10,
	},
	percentages: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	note: {
		marginTop: 16,
	},
	amountContainer: {
		marginTop: 'auto',
	},
	amountCaption: {
		marginBottom: 16,
	},
	numberpad: {
		marginTop: 16,
		marginHorizontal: -16,
	},
	buttonCustom: {
		marginTop: 16,
		alignSelf: 'flex-start',
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 16,
		marginTop: 42,
	},
	button: {
		flex: 1,
	},
});

export default QuickSetup;
