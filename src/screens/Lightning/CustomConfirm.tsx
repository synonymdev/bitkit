import React, { ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import {
	AnimatedView,
	Caption13Up,
	Display,
	Text01S,
	Text01M,
	LightningIcon,
	PenIcon,
} from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import Money from '../../components/Money';
import useColors from '../../hooks/colors';
import useDisplayValues from '../../hooks/displayValues';
import NumberPadWeeks from './NumberPadWeeks';

const CustomConfirm = ({ navigation, route }): ReactElement => {
	const { spendingAmount, receivingAmount, receivingCost } = route.params;
	const cost = useDisplayValues(receivingCost);
	const colors = useColors();
	const [keybrd, setKeybrd] = useState(false);
	const [loading, setLoading] = useState(false);
	const [weeks, setWeeks] = useState(6);

	const handleConfirm = (): void => {
		setLoading(true);
		navigation.navigate('Result');
	};

	return (
		<GlowingBackground topLeft={colors.purple}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Add instant payments" />
			<View style={styles.root}>
				{!keybrd && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Display>
							3) <Display color="purple">Please{'\n'}confirm.</Display>
						</Display>
						<Text01S color="gray1" style={styles.text}>
							It costs
							<Text01S>
								{' ' + cost.fiatSymbol + cost.fiatFormatted + ' '}
							</Text01S>
							to connect you and set up your balance. Your Lightning connection
							will stay open for at least
							<Text01S onPress={(): void => setKeybrd(true)}>
								{' '}
								{weeks} weeks <PenIcon height={18} width={18} />
							</Text01S>
							.
						</Text01S>

						<View style={styles.block}>
							<Caption13Up color="purple" style={styles.space}>
								SPENDING BALANCE
							</Caption13Up>
							<Money
								sats={spendingAmount}
								size="headline"
								symbol={true}
								style={styles.space}
							/>
							<Money
								sats={spendingAmount}
								size="text01m"
								showFiat={true}
								color="gray2"
								style={styles.space}
							/>
						</View>

						<View style={styles.block}>
							<Caption13Up color="purple" style={styles.space}>
								RECEIVING BANDWIDTH
							</Caption13Up>
							<Money
								sats={receivingAmount}
								size="headline"
								symbol={true}
								style={styles.space}
							/>
							<Money
								sats={receivingAmount}
								size="text01m"
								showFiat={true}
								color="gray2"
								style={styles.space}
							/>
						</View>
					</AnimatedView>
				)}

				{!keybrd && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<SwipeToConfirm
							text="Swipe to pay & connect"
							color="purple"
							onConfirm={handleConfirm}
							icon={<LightningIcon width={30} height={30} color="black" />}
							loading={loading}
							confirmed={loading}
						/>
						<SafeAreaInsets type="bottom" />
					</AnimatedView>
				)}

				{keybrd && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Display color="purple">Connection Duration.</Display>
						<Text01S color="gray1" style={styles.text}>
							Choose the minimum number of weeks you want your connection to
							remain open.
						</Text01S>
					</AnimatedView>
				)}

				{keybrd && (
					<AnimatedView
						color="transparent"
						entering={FadeIn}
						exiting={FadeOut}
						style={styles.weeks}>
						<Display>{weeks}</Display>
						<Text01M color="gray1" style={styles.text}>
							weeks
						</Text01M>
					</AnimatedView>
				)}

				{keybrd && (
					<NumberPadWeeks
						weeks={weeks}
						onChange={setWeeks}
						onDone={(): void => setKeybrd(false)}
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
		marginTop: 16,
		marginBottom: 40,
	},
	space: {
		marginBottom: 8,
	},
	block: {
		borderColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginBottom: 16,
	},
	weeks: {
		alignSelf: 'flex-start',
		alignItems: 'center',
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default CustomConfirm;
