import React, { ReactElement, useState, useCallback, useEffect } from 'react';
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
import { sleep } from '../../utils/helpers';
import { useLightningBalance } from '../../hooks/lightning';
import type { TransferScreenProps } from '../../navigation/types';

const Setup = ({ navigation }: TransferScreenProps<'Setup'>): ReactElement => {
	const lightningBalance = useLightningBalance();
	const currentBalance = useBalance({ onchain: true, lightning: true });
	const currentSpendingAmount = lightningBalance.localBalance;
	const [keybrd, setKeybrd] = useState(false);
	const [loading, setLoading] = useState(false);
	const [totalBalance, setTotalBalance] = useState(0);
	const [spendingAmount, setSpendingAmount] = useState(currentSpendingAmount);

	const savingsAmount = totalBalance - spendingAmount;
	const spendingPercentage =
		totalBalance > 0 ? Math.round((spendingAmount / totalBalance) * 100) : 0;
	const savingsPercentage =
		totalBalance > 0 ? Math.round((savingsAmount / totalBalance) * 100) : 0;

	useEffect(() => {
		// let spendingLimit = Math.round(currentBalance.satoshis / 1.5);
		let spendingLimit = Math.round(currentBalance.satoshis / 1.2);
		setTotalBalance(spendingLimit);
	}, [currentBalance.satoshis]);

	const handleChange = useCallback((value: number) => {
		setSpendingAmount(Math.round(value));
	}, []);

	const onContinuePress = useCallback(async (): Promise<void> => {
		setLoading(true);
		sleep(5000);
		setLoading(false);
		navigation.push('Confirm', {
			spendingAmount,
			total: totalBalance,
		});
	}, [navigation, spendingAmount, totalBalance]);

	const isButtonDisabled = spendingAmount === lightningBalance.localBalance;

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
										maximumValue={totalBalance}
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
						sats={spendingAmount}
						onChange={setSpendingAmount}
						onMaxPress={(): void => {
							setSpendingAmount(totalBalance);
						}}
						onDone={(): void => {
							if (spendingAmount > totalBalance) {
								setSpendingAmount(totalBalance);
							}
							setKeybrd(false);
						}}
						style={styles.numberpad}
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
