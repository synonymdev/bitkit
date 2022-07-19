import React, { ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import {
	AnimatedView,
	Caption13Up,
	Display,
	LightningIcon,
	Text01S,
} from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import useColors from '../../hooks/colors';
import AmountToggle from '../../components/AmountToggle';
import SwipeToConfirm from '../../components/SwipeToConfirm';

import { Percentage } from './QuickSetup';
import PieChart from './PieChart';
import NumberPadLightning from './NumberPadLightning';

const PIE_SIZE = 140;
const PIE_SHIFT = 70;

const QuickConfirm = ({ navigation, route }): ReactElement => {
	const colors = useColors();
	const { total } = route.params;
	const [spendingAmount, setSpendingAmount] = useState(
		route.params.spendingAmount,
	);
	const [keybrd, setKeybrd] = useState(false);
	const [loading, setLoading] = useState(false);

	const savingsAmount = total - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / total) * 100);
	const savingsPercentage = Math.round((savingsAmount / total) * 100);

	const handleConfirm = (): void => {
		setLoading(true);
		navigation.navigate('Result');
	};

	return (
		<GlowingBackground topLeft={colors.purple}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Add instant payments" />
			<View style={styles.root}>
				<View>
					<Display color="purple">Please {'\n'}confirm.</Display>
					<Text01S color="gray1" style={styles.text}>
						It costs <Text01S>$TODO</Text01S> to connect you to Lightning and
						set up your spending balance.
					</Text01S>
				</View>

				{!keybrd && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<View style={styles.chartContainer}>
							<View style={styles.chart}>
								<PieChart
									size={PIE_SIZE}
									shift={PIE_SHIFT}
									primary={spendingPercentage}
								/>
							</View>
							<View style={styles.percContainer}>
								<Percentage value={spendingPercentage} type="spendings" />
								<Percentage value={savingsPercentage} type="savings" />
							</View>
						</View>
					</AnimatedView>
				)}

				<View>
					<View style={styles.amountBig}>
						<View>
							<Caption13Up style={styles.amountTitle} color="purple">
								SPENDING BALANCE
							</Caption13Up>
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
							<SwipeToConfirm
								text="Swipe to connect"
								color="purple"
								onConfirm={handleConfirm}
								icon={<LightningIcon width={30} height={30} color="black" />}
								loading={loading}
								confirmed={loading}
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
	amountBig: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 32,
	},
	amountTitle: {
		marginBottom: 8,
	},
	chartContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	chart: {
		marginTop: -PIE_SHIFT,
		marginLeft: -PIE_SHIFT,
		width: PIE_SIZE + PIE_SHIFT,
		height: PIE_SIZE + PIE_SHIFT,
		marginRight: 32,
	},
	percContainer: {
		alignSelf: 'stretch',
		justifyContent: 'space-around',
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default QuickConfirm;
