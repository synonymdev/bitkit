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
import { Caption13Up, Display, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Percentage from '../../components/Percentage';
import Button from '../../components/Button';
import FancySlider from '../../components/FancySlider';
import NumberPadLightning from './NumberPadLightning';
import { useBalance } from '../../hooks/wallet';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import { startChannelPurchase } from '../../store/actions/blocktank';
import { showErrorNotification } from '../../utils/notifications';
import {
	convertCurrency,
	convertToSats,
	fiatToBitcoinUnit,
} from '../../utils/exchange-rate';
import { SPENDING_LIMIT_RATIO } from '../../utils/wallet/constants';
import type { LightningScreenProps } from '../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { blocktankServiceSelector } from '../../store/reselect/blocktank';
import {
	balanceUnitSelector,
	selectedCurrencySelector,
} from '../../store/reselect/settings';
import { EBalanceUnit, EBitcoinUnit } from '../../store/types/wallet';
import NumberPadTextField from '../../components/NumberPadTextField';
import { getNumberPadText } from '../../utils/numberpad';
import { updateSettings } from '../../store/actions/settings';

const QuickSetup = ({
	navigation,
}: LightningScreenProps<'QuickSetup'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [loading, setLoading] = useState(false);
	const [totalBalance, setTotalBalance] = useState(0);
	const [textFieldValue, setTextFieldValue] = useState('');
	const currentBalance = useBalance({ onchain: true });
	const unit = useSelector(balanceUnitSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const blocktankService = useSelector(blocktankServiceSelector);
	const selectedCurrency = useSelector(selectedCurrencySelector);

	const spendingLimit = useMemo(() => {
		const spendableBalance = Math.round(
			currentBalance.satoshis / SPENDING_LIMIT_RATIO,
		);
		const convertedUnit = convertCurrency({
			amount: 999,
			from: 'USD',
			to: selectedCurrency,
		});
		const maxSpendingLimit = fiatToBitcoinUnit({
			fiatValue: convertedUnit.fiatValue,
			bitcoinUnit: EBitcoinUnit.satoshi,
		});
		if (!maxSpendingLimit) {
			return spendableBalance;
		}
		return Math.min(spendableBalance, maxSpendingLimit);
	}, [currentBalance.satoshis, selectedCurrency]);

	const spendingAmount = useMemo((): number => {
		return convertToSats(textFieldValue, unit);
	}, [textFieldValue, unit]);

	const savingsAmount = totalBalance - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / totalBalance) * 100);
	const savingsPercentage = Math.round((savingsAmount / totalBalance) * 100);

	useEffect(() => {
		setTotalBalance(spendingLimit);
	}, [
		blocktankService?.max_chan_spending,
		currentBalance.satoshis,
		spendingLimit,
	]);

	// default spendingPercentage to 20%
	useEffect(() => {
		const defaultSpendingAmount = Math.round(totalBalance * 0.2);
		const result = getNumberPadText(defaultSpendingAmount, unit);
		setTextFieldValue(result);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [totalBalance]);

	useFocusEffect(
		useCallback(() => {
			resetOnChainTransaction({ selectedNetwork, selectedWallet });
			setupOnChainTransaction({
				selectedNetwork,
				selectedWallet,
			}).then();
		}, [selectedNetwork, selectedWallet]),
	);

	// BTC -> satoshi -> fiat
	const nextUnit = useMemo(() => {
		if (unit === EBalanceUnit.BTC) {
			return EBalanceUnit.satoshi;
		}
		if (unit === EBalanceUnit.satoshi) {
			return EBalanceUnit.fiat;
		}
		return EBalanceUnit.BTC;
	}, [unit]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(spendingAmount, nextUnit);
		setTextFieldValue(result);

		updateSettings({
			balanceUnit: nextUnit,
			...(nextUnit !== EBalanceUnit.fiat && {
				bitcoinUnit: nextUnit as unknown as EBitcoinUnit,
			}),
		});
	};

	const onSliderChange = useCallback(
		(value: number) => {
			const result = getNumberPadText(Math.round(value), unit);
			setTextFieldValue(result);
		},
		[unit],
	);

	const onMax = useCallback(() => {
		const result = getNumberPadText(totalBalance, unit);
		setTextFieldValue(result);
	}, [totalBalance, unit]);

	const onDone = useCallback(() => {
		setShowNumberPad(false);
	}, []);

	const onContinue = useCallback(async (): Promise<void> => {
		setLoading(true);
		const localBalance =
			Math.round(spendingAmount * 1.1) > blocktankService.min_channel_size
				? Math.round(spendingAmount * 1.1)
				: blocktankService.min_channel_size;
		const purchaseResponse = await startChannelPurchase({
			selectedNetwork,
			selectedWallet,
			productId: blocktankService.product_id,
			remoteBalance: spendingAmount,
			localBalance,
			channelExpiry: 12,
		});

		if (purchaseResponse.isErr()) {
			showErrorNotification({
				title: t('error_channel_purchase'),
				message: purchaseResponse.error.message,
			});
			setLoading(false);
			return;
		}
		setLoading(false);
		navigation.push('QuickConfirm', {
			spendingAmount: spendingAmount,
			total: totalBalance,
			orderId: purchaseResponse.value,
		});
	}, [
		spendingAmount,
		blocktankService,
		selectedNetwork,
		selectedWallet,
		totalBalance,
		navigation,
		t,
	]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={t('add_instant_payments')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root}>
				<View>
					<Display color="purple">
						{t(showNumberPad ? 'spending_money' : 'spending_balance')}
					</Display>
					<Text01S color="gray1" style={styles.text}>
						{t(showNumberPad ? 'enter_money' : 'enter_amount')}
					</Text01S>
				</View>

				{!showNumberPad && (
					<>
						<View style={styles.grow1} />
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
									minimumValue={0}
									maximumValue={totalBalance}
									onValueChange={onSliderChange}
								/>
							</View>
							<View style={styles.row}>
								<Percentage value={spendingPercentage} type="spending" />
								<Percentage value={savingsPercentage} type="savings" />
							</View>
						</AnimatedView>
						<View style={styles.grow2} />
					</>
				)}

				<View>
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
							testID="QuickSetupNumberField"
							onPress={(): void => setShowNumberPad(true)}
						/>
					</View>

					{!showNumberPad && (
						<AnimatedView
							style={styles.button}
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<Button
								loading={loading}
								text={t('continue')}
								size="large"
								disabled={spendingAmount === 0}
								testID="QuickSetupContinue"
								onPress={onContinue}
							/>
							<SafeAreaInsets type="bottom" />
						</AnimatedView>
					)}
				</View>

				{showNumberPad && (
					<NumberPadLightning
						style={styles.numberpad}
						value={textFieldValue}
						maxAmount={totalBalance}
						onChange={setTextFieldValue}
						onChangeUnit={onChangeUnit}
						onMax={onMax}
						onDone={onDone}
					/>
				)}
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'space-between',
		marginTop: 8,
		marginBottom: 16,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 8,
		marginBottom: 8,
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
	amount: {
		marginBottom: 27,
	},
	amountCaption: {
		marginBottom: 4,
	},
	numberpad: {
		marginHorizontal: -16,
	},
	grow1: {
		flexGrow: 1,
	},
	grow2: {
		flexGrow: 2,
	},
	button: {
		marginTop: 11,
	},
});

export default QuickSetup;
