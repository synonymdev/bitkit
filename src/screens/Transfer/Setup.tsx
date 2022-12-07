import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import {
	AnimatedView,
	Caption13Up,
	Display,
	Text01S,
} from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import AmountToggle from '../../components/AmountToggle';
import Percentage from '../../components/Percentage';
import FancySlider from '../../components/FancySlider';
import NumberPadLightning from '../Lightning/NumberPadLightning';
import { useBalance } from '../../hooks/wallet';
import { useLightningBalance } from '../../hooks/lightning';
import { showErrorNotification } from '../../utils/notifications';
import { startChannelPurchase } from '../../store/actions/blocktank';
import { useSelector } from 'react-redux';
import Store from '../../store/types';
import { SPENDING_LIMIT_RATIO } from '../../utils/wallet/constants';
import { convertCurrency } from '../../utils/blocktank';
import { fiatToBitcoinUnit } from '../../utils/exchange-rate';
import type { TransferScreenProps } from '../../navigation/types';

const Setup = ({ navigation }: TransferScreenProps<'Setup'>): ReactElement => {
	const balance = useBalance({ onchain: true, lightning: true });
	const { localBalance: currentSpendingAmount } = useLightningBalance();
	const [keybrd, setKeybrd] = useState(false);
	const [loading, setLoading] = useState(false);
	const [spendingAmount, setSpendingAmount] = useState(currentSpendingAmount);

	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const blocktankService = useSelector(
		(state: Store) => state.blocktank.serviceList[0],
	);
	const selectedCurrency = useSelector(
		(state: Store) => state.settings.selectedCurrency,
	);

	const spendingLimit = useMemo(() => {
		const spendableBalance = Math.round(
			balance.satoshis / SPENDING_LIMIT_RATIO,
		);

		const convertedUnit = convertCurrency({
			amount: 999,
			from: 'USD',
			to: selectedCurrency,
		});
		const maxSpendingLimit = fiatToBitcoinUnit({
			fiatValue: convertedUnit.fiatValue,
			bitcoinUnit: 'satoshi',
		});

		return Math.min(spendableBalance, maxSpendingLimit);
	}, [balance.satoshis, selectedCurrency]);

	const savingsAmount = spendingLimit - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / spendingLimit) * 100);
	const savingsPercentage = Math.round((savingsAmount / spendingLimit) * 100);
	const isTransferringToSavings = spendingAmount < currentSpendingAmount;
	const isButtonDisabled = spendingAmount === currentSpendingAmount;

	const handleChange = useCallback((value: number) => {
		setSpendingAmount(Math.round(value));
	}, []);

	const onContinuePress = useCallback(async (): Promise<void> => {
		if (isTransferringToSavings) {
			navigation.push('Confirm', {
				spendingAmount,
				total: spendingLimit,
			});
		} else {
			// buy an additional channel from Blocktank with the difference
			setLoading(true);
			const remoteBalance = spendingAmount - currentSpendingAmount;
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
					title: 'Channel Purchase Error',
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
		}
	}, [
		blocktankService,
		isTransferringToSavings,
		currentSpendingAmount,
		spendingAmount,
		spendingLimit,
		selectedNetwork,
		selectedWallet,
		navigation,
	]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Transfer Funds"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.root}>
				<View>
					{keybrd ? (
						<>
							<Display color="purple">Spending Money.</Display>
							<Text01S color="gray1" style={styles.text}>
								Enter the amount of money you want to be able to spend
								instantly.
							</Text01S>
						</>
					) : (
						<>
							<Display color="purple">Spending{'\n'}& Saving.</Display>
							<Text01S color="gray1" style={styles.text}>
								Choose how much bitcoin you want to be able to spend instantly
								and how much you want to keep in savings.
							</Text01S>
							<AnimatedView
								style={styles.sliderSection}
								color="transparent"
								entering={FadeIn}
								exiting={FadeOut}>
								<View style={styles.row}>
									<Caption13Up color="purple">SPENDING</Caption13Up>
									<Caption13Up color="orange">SAVINGS</Caption13Up>
								</View>
								<View style={styles.sliderContainer}>
									<FancySlider
										minimumValue={0}
										maximumValue={spendingLimit}
										value={spendingAmount}
										snapPoint={currentSpendingAmount}
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
							<Caption13Up color="purple">Spending balance</Caption13Up>
						)}
						<AmountToggle
							sats={spendingAmount}
							unit="fiat"
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
								text="Continue"
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
