import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Caption13Up, Display, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import AmountToggle from '../../components/AmountToggle';
import Percentage from '../../components/Percentage';
import FancySlider from '../../components/FancySlider';
import NumberPadLightning from '../Lightning/NumberPadLightning';
import { useBalance } from '../../hooks/wallet';
import { showErrorNotification } from '../../utils/notifications';
import { startChannelPurchase } from '../../store/actions/blocktank';
import { useSelector } from 'react-redux';
import { SPENDING_LIMIT_RATIO } from '../../utils/wallet/constants';
import { convertCurrency } from '../../utils/blocktank';
import { fiatToBitcoinUnit } from '../../utils/exchange-rate';
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
import { selectedCurrencySelector } from '../../store/reselect/settings';
import { EBitcoinUnit } from '../../store/types/wallet';

const Setup = ({ navigation }: TransferScreenProps<'Setup'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { satoshis: onChainBalance } = useBalance({ onchain: true });
	const { satoshis: lightningBalance } = useBalance({
		lightning: true,
		subtractReserveBalance: false,
	});
	const [keybrd, setKeybrd] = useState(false);
	const [loading, setLoading] = useState(false);
	const [spendingAmount, setSpendingAmount] = useState(lightningBalance);

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

	const savingsAmount = spendingLimit - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / spendingLimit) * 100);
	const savingsPercentage = Math.round((savingsAmount / spendingLimit) * 100);
	const isTransferringToSavings = spendingAmount < lightningBalance;
	const isButtonDisabled = spendingAmount === lightningBalance;

	const handleChange = useCallback((value: number) => {
		setSpendingAmount(Math.round(value));
	}, []);

	const onContinuePress = useCallback(async (): Promise<void> => {
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
					{keybrd ? (
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
										minimumValue={0}
										maximumValue={spendingLimit}
										value={spendingAmount}
										snapPoint={lightningBalance}
										onValueChange={handleChange}
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
					<View style={styles.amountBig}>
						{!keybrd && (
							<Caption13Up color="purple">{t('spending_label')}</Caption13Up>
						)}
						<AmountToggle
							sats={spendingAmount}
							onPress={(): void => setKeybrd(true)}
						/>
					</View>

					{!keybrd && (
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
								onPress={onContinuePress}
							/>
							<SafeAreaInsets type="bottom" />
						</AnimatedView>
					)}
				</View>

				{keybrd && (
					<NumberPadLightning
						style={styles.numberpad}
						sats={spendingAmount}
						onChange={setSpendingAmount}
						onMaxPress={(): void => {
							setSpendingAmount(spendingLimit);
						}}
						onDone={(): void => {
							if (spendingAmount > spendingLimit) {
								setSpendingAmount(spendingLimit);
							}
							setKeybrd(false);
						}}
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
	amountBig: {
		marginBottom: 32,
	},
	buttonContainer: {
		marginBottom: 16,
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default Setup;
