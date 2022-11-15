import React, {
	ReactElement,
	useState,
	useCallback,
	useMemo,
	useEffect,
} from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
	AnimatedView,
	Caption13Up,
	Display,
	Headline,
	CoinsIcon,
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
import type { LightningScreenProps } from '../../navigation/types';
import Store from '../../store/types';
import { useBalance } from '../../hooks/wallet';
import { sleep } from '../../utils/helpers';

export const Percentage = ({ value, type }): ReactElement => {
	return (
		<View style={styles.pRoot}>
			{type === 'spendings' ? (
				<CoinsIcon color="purple" height={26} width={26} />
			) : (
				<SavingsIcon color="orange" height={32} width={32} />
			)}

			<Headline lineHeight="40px" style={styles.pText}>
				{value}
				<Text01S>%</Text01S>
			</Headline>
		</View>
	);
};

const RebalanceSetup = ({
	navigation,
}: LightningScreenProps<'RebalanceSetup'>): ReactElement => {
	const colors = useColors();
	const [keybrd, setKeybrd] = useState(false);
	const [loading, setLoading] = useState(false);
	const [totalBalance, setTotalBalance] = useState(0);
	const [spendingAmount, setSpendingAmount] = useState(0);
	const currentBalance = useBalance({ onchain: true });
	const bitcoinUnit = useSelector((state: Store) => state.settings.bitcoinUnit);
	const unitPreference = useSelector(
		(state: Store) => state.settings.unitPreference,
	);
	const savingsAmount = totalBalance - spendingAmount;
	const spendingPercentage =
		totalBalance > 0 ? Math.round((spendingAmount / totalBalance) * 100) : 0;
	const savingsPercentage =
		totalBalance > 0 ? Math.round((savingsAmount / totalBalance) * 100) : 0;

	const handleChange = useCallback((v) => {
		setSpendingAmount(Math.round(v));
	}, []);

	const unit = useMemo(() => {
		if (unitPreference === 'fiat') {
			return 'fiat';
		}
		if (bitcoinUnit === 'BTC') {
			return 'BTC';
		}
		return 'satoshi';
	}, [bitcoinUnit, unitPreference]);

	useEffect(() => {
		let spendingLimit = Math.round(currentBalance.satoshis / 1.5);
		setTotalBalance(spendingLimit);
	}, [currentBalance.satoshis]);

	const onContinuePress = useCallback(async (): Promise<void> => {
		setLoading(true);
		sleep(5000);
		setLoading(false);
		navigation.push('RebalanceConfirm', {
			spendingAmount,
			total: totalBalance,
		});
	}, [navigation, spendingAmount, totalBalance]);

	return (
		<GlowingBackground topLeft={colors.purple}>
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
						<Display color="purple">Spending Money.</Display>
					) : (
						<Display color="purple">Spending{'\n'}& saving.</Display>
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
							<Caption13Up color="purple">SPENDING</Caption13Up>
							<Caption13Up color="purple">SAVINGS</Caption13Up>
						</View>
						<View style={styles.row}>
							<Money
								sats={spendingAmount}
								size="text02m"
								symbol={true}
								color="white"
								unit={unit}
							/>
							<Money
								sats={savingsAmount}
								size="text02m"
								symbol={true}
								color="white"
								unit={unit}
							/>
						</View>
						<View style={styles.sliderContainer}>
							<FancySlider
								minimumValue={0}
								maximumValue={totalBalance}
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
								loading={loading}
								text="Continue"
								size="large"
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
	pRoot: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	pText: {
		marginLeft: 8,
		paddingTop: Platform.OS === 'android' ? 20 : 0,
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default RebalanceSetup;
