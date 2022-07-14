import React, { ReactElement, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import {
	AnimatedView,
	Caption13Up,
	Display,
	Headline,
	LightningIcon,
	SavingsIcon,
	Text01S,
} from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import Money from '../../components/Money';
import useColors from '../../hooks/colors';
import AmountToggle from '../../components/AmountToggle';
import FancySlider from '../../components/FancySlider';

import NumberPadLightning from './NumberPadLightning';

export const Percentage = ({ value, type }): ReactElement => {
	return (
		<View style={styles.pRoot}>
			{type === 'spendings' ? (
				<LightningIcon height={28} width={20} style={styles.lightningIcon} />
			) : (
				<SavingsIcon
					color="orange"
					height={32}
					width={32}
					style={styles.savingsIcon}
				/>
			)}

			<Headline>
				{value}
				<Text01S>%</Text01S>
			</Headline>
		</View>
	);
};

const QuickSetup = ({ navigation }): ReactElement => {
	const colors = useColors();
	const [keybrd, setKeybrd] = useState(false);
	const total = 100500; // TODO: use real value
	const [spendingAmount, setSpendingAmount] = useState(total * 0.2); // 20% of total

	const savingsAmount = total - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / total) * 100);
	const savingsPercentage = Math.round((savingsAmount / total) * 100);

	const handleChange = useCallback((v) => {
		setSpendingAmount(Math.round(v));
	}, []);

	return (
		<GlowingBackground topLeft={colors.purple}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Add instant payments" />
			<View style={styles.root}>
				<View>
					{keybrd ? (
						<Display color="purple">Spending money.</Display>
					) : (
						<Display color="purple">Spending &{'\u00A0'}saving.</Display>
					)}
					{keybrd ? (
						<Text01S color="gray1" style={styles.text}>
							Enter the amount of money you want to be able to spend instantly.
						</Text01S>
					) : (
						<Text01S color="gray1" style={styles.text}>
							Choose how much bitcoin you want to be able to spend instantly and
							how much you want to keep in savings.
						</Text01S>
					)}
				</View>

				{!keybrd && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<View style={styles.row}>
							<Caption13Up color="purple">SPENDING BALANCE</Caption13Up>
							<Caption13Up color="purple">SAVINGS</Caption13Up>
						</View>
						<View style={styles.row}>
							<Money
								sats={spendingAmount}
								size="text02m"
								symbol={true}
								color="white"
							/>
							<Money
								sats={savingsAmount}
								size="text02m"
								symbol={true}
								color="white"
							/>
						</View>
						<View style={styles.sliderContainer}>
							<FancySlider
								minimumValue={0}
								maximumValue={total}
								value={spendingAmount}
								onValueChange={handleChange}
							/>
						</View>
						<View style={styles.row}>
							<Percentage value={spendingPercentage} type="spendings" />
							<Percentage value={savingsPercentage} type="savings" />
						</View>
					</AnimatedView>
				)}

				<View>
					<View style={styles.amountBig}>
						<View>
							{!keybrd && (
								<Caption13Up color="purple" style={styles.amountBigCaption}>
									SPENDING BALANCE
								</Caption13Up>
							)}
							<AmountToggle
								sats={spendingAmount}
								onPress={(): void => setKeybrd(true)}
							/>
						</View>
					</View>

					{!keybrd && (
						<AnimatedView
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<Button
								text="Continue"
								size="large"
								onPress={(): void => {
									navigation.push('QuickConfirm', {
										spendingAmount,
										total,
									});
								}}
							/>
							<SafeAreaInsets type="bottom" />
						</AnimatedView>
					)}
				</View>

				{keybrd && (
					<NumberPadLightning
						sats={spendingAmount}
						onChange={setSpendingAmount}
						onDone={(): void => {
							if (spendingAmount > total) {
								setSpendingAmount(total);
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
		display: 'flex',
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
		marginVertical: 4,
	},
	sliderContainer: {
		marginTop: 24,
		marginBottom: 16,
	},
	amountBig: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 32,
	},
	amountBigCaption: {
		marginBottom: 4,
	},
	lightningIcon: {
		marginLeft: 7,
	},
	savingsIcon: {
		marginLeft: 1,
	},
	pRoot: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: 100,
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default QuickSetup;
