import React, {
	ReactElement,
	useState,
	useCallback,
	useMemo,
	useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Caption13Up, Display, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import NumberPadTextField from '../../components/NumberPadTextField';
import Button from '../../components/Button';
import Percentage from '../../components/Percentage';
import FancySlider from '../../components/FancySlider';
import NumberPadLightning from '../Lightning/NumberPadLightning';
import { useBalance } from '../../hooks/wallet';
import { showErrorNotification } from '../../utils/notifications';
import { startChannelPurchase } from '../../store/actions/blocktank';
import { useSelector } from 'react-redux';
import { SPENDING_LIMIT_RATIO } from '../../utils/wallet/constants';
import {
	convertCurrency,
	convertToSats,
	fiatToBitcoinUnit,
} from '../../utils/exchange-rate';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import type { TransferScreenProps } from '../../navigation/types';
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
import { getNumberPadText } from '../../utils/numberpad';
import { updateSettings } from '../../store/actions/settings';

const Setup = ({ navigation }: TransferScreenProps<'Setup'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { satoshis: onChainBalance } = useBalance({ onchain: true });
	const { satoshis: lightningBalance } = useBalance({
		lightning: true,
		subtractReserveBalance: false,
	});

	const [textFieldValue, setTextFieldValue] = useState('');
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [loading, setLoading] = useState(false);
	const unit = useSelector(balanceUnitSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const blocktankService = useSelector(blocktankServiceSelector);
	const selectedCurrency = useSelector(selectedCurrencySelector);

	useFocusEffect(
		useCallback(() => {
			resetOnChainTransaction({ selectedNetwork, selectedWallet });
			setupOnChainTransaction({
				selectedNetwork,
				selectedWallet,
			}).then();
		}, [selectedNetwork, selectedWallet]),
	);

	const spendingLimit = useMemo(() => {
		const spendableBalance =
			Math.round(onChainBalance / SPENDING_LIMIT_RATIO) + lightningBalance;

		const convertedUnit = convertCurrency({
			amount: 999,
			from: 'USD',
			to: selectedCurrency,
		});
		const maxSpendingLimit = fiatToBitcoinUnit({
			fiatValue: convertedUnit.fiatValue,
			bitcoinUnit: EBitcoinUnit.satoshi,
		});

		const min = Math.min(spendableBalance, maxSpendingLimit);
		return min < lightningBalance ? lightningBalance : min;
	}, [selectedCurrency, lightningBalance, onChainBalance]);

	const spendingAmount = useMemo((): number => {
		return convertToSats(textFieldValue, unit);
	}, [textFieldValue, unit]);

	const savingsAmount = spendingLimit - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / spendingLimit) * 100);
	const savingsPercentage = Math.round((savingsAmount / spendingLimit) * 100);
	const isTransferringToSavings = spendingAmount < lightningBalance;
	const isButtonDisabled = spendingAmount === lightningBalance;

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
				total: spendingLimit,
			});
			return;
		}

		// buy an additional channel from Blocktank with the difference
		setLoading(true);
		const remoteBalance = spendingAmount - lightningBalance;
		const localBalance =
			Math.round(remoteBalance * 1.1) > blocktankService.min_channel_size
				? Math.round(remoteBalance * 1.1)
				: blocktankService.min_channel_size;

		const purchaseResponse = await startChannelPurchase({
			selectedNetwork,
			selectedWallet,
			productId: blocktankService.product_id,
			remoteBalance,
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
		navigation.push('Confirm', {
			spendingAmount,
			total: spendingLimit,
			orderId: purchaseResponse.value,
		});
	}, [
		blocktankService,
		isTransferringToSavings,
		lightningBalance,
		spendingAmount,
		spendingLimit,
		selectedNetwork,
		selectedWallet,
		navigation,
		t,
	]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={t('transfer_funds')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root}>
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
										minimumValue={0}
										maximumValue={spendingLimit}
										snapPoint={lightningBalance}
										onValueChange={onSliderChange}
									/>
								</View>
								<View style={styles.row}>
									<Percentage value={spendingPercentage} type="spending" />
									<Percentage value={savingsPercentage} type="savings" />
								</View>
							</AnimatedView>
						</>
					)}
				</View>

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
							testID="TransferSetupNumberField"
							onPress={(): void => setShowNumberPad(true)}
						/>
					</View>

					{!showNumberPad && (
						<AnimatedView
							style={styles.buttonContainer}
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<Button
								text={t('continue')}
								size="large"
								loading={loading}
								disabled={isButtonDisabled}
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
						maxAmount={spendingLimit}
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
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 8,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sliderSection: {
		marginTop: 42,
	},
	sliderContainer: {
		marginTop: 24,
		marginBottom: 16,
	},
	amount: {
		marginBottom: 32,
	},
	amountCaption: {
		marginBottom: 4,
	},
	buttonContainer: {
		marginBottom: 16,
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default Setup;
