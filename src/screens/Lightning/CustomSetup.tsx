import React, { ReactElement, memo, useMemo, useState, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
	AnimatedView,
	Caption13Up,
	CoinsIcon,
	DisplayHaas,
	ReceiveIcon,
	SendIcon,
	Subtitle,
	Text01S,
	TouchableOpacity,
	View as ThemedView,
} from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import useColors from '../../hooks/colors';
import AmountToggle from '../../components/AmountToggle';
import Store from '../../store/types';
import useDisplayValues from '../../hooks/displayValues';

import NumberPadLightning from './NumberPadLightning';

const PACKAGES_SPENDING = [
	{
		id: 'small',
		usdAmount: 0,
		img: null,
	},
	{
		id: 'medium',
		usdAmount: 100,
		img: require('../../assets/illustrations/coin-stack-2.png'),
	},
	{
		id: 'big',
		usdAmount: 500,
		img: require('../../assets/illustrations/coin-stack-3.png'),
	},
];

const PACKAGES_RECEIVING = [
	{
		id: 'small',
		usdAmount: 250,
		img: require('../../assets/illustrations/coin-stack-1.png'),
	},
	{
		id: 'medium',
		usdAmount: 1000,
		img: require('../../assets/illustrations/coin-stack-2.png'),
	},
	{
		id: 'big',
		usdAmount: 2500,
		img: require('../../assets/illustrations/coin-stack-3.png'),
	},
];

const Barrel = ({ active, id, amount, img, onPress }): ReactElement => {
	const colors = useColors();
	const style = useMemo(
		() =>
			active ? [styles.bRoot, { borderColor: colors.purple }] : styles.bRoot,
		[active, colors.purple],
	);
	const dp = useDisplayValues(Number(amount));

	return (
		<TouchableOpacity
			color="purple16"
			style={style}
			onPress={(): void => onPress(id)}>
			<Image style={styles.bImage} source={img} />
			<Subtitle style={styles.bAmount}>
				{dp.fiatSymbol} {dp.fiatFormatted}
			</Subtitle>
		</TouchableOpacity>
	);
};

const CustomSetup = ({ navigation, route }): ReactElement => {
	const spending = route?.params?.spending;
	const colors = useColors();
	const [keybrd, setKeybrd] = useState(false);
	const [amount, setAmount] = useState(0);
	const [pkgRates, setPkgRates] = useState({});
	const usdRate = useSelector((state: Store) => state.wallet.exchangeRates.USD);
	const packages = spending ? PACKAGES_SPENDING : PACKAGES_RECEIVING;

	useEffect(() => {
		const rates = { small: 0, medium: 0, big: 0 };
		packages.forEach(({ id, usdAmount }) => {
			// convert to sats
			rates[id] = Math.round((usdAmount * 10e7) / usdRate);
		});

		setPkgRates(rates);
		setAmount(rates.medium);

		// run only on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleBarrelPress = (id): void => {
		setAmount(pkgRates[id]);
	};

	return (
		<GlowingBackground topLeft={colors.purple}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Add instant payments" />
			<View style={styles.root}>
				<View>
					<DisplayHaas color="purple">
						{spending ? 'Spending money.' : 'Receiving money.'}
					</DisplayHaas>
					{spending && !keybrd && (
						<Text01S color="gray1" style={styles.text}>
							Choose how much bitcoin you want to have available as your instant
							spending balance.
						</Text01S>
					)}
					{spending && keybrd && (
						<Text01S color="gray1" style={styles.text}>
							Enter the amount of Bitcoin you want to be able to send instantly.
						</Text01S>
					)}
					{!spending && !keybrd && (
						<Text01S color="gray1" style={styles.text}>
							Choose how much money you want to be able to receive instantly.
						</Text01S>
					)}
					{!spending && keybrd && (
						<Text01S color="gray1" style={styles.text}>
							Enter the amount of Bitcoin you want to be able to receive
							instantly.
						</Text01S>
					)}
				</View>

				{!keybrd && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<View style={styles.barrels}>
							{packages.map((p) => (
								<Barrel
									key={p.id}
									id={p.id}
									active={pkgRates[p.id] === amount}
									amount={pkgRates[p.id]}
									img={p.img}
									onPress={handleBarrelPress}
								/>
							))}
						</View>
						<Button
							text="Enter custom amount"
							style={styles.buttonCustom}
							onPress={(): void => setKeybrd((k) => !k)}
						/>
					</AnimatedView>
				)}

				<View>
					<View style={styles.amountBig}>
						<View>
							{!keybrd && (
								<Caption13Up color="purple">
									{spending ? 'SPENDING BALANCE' : 'RECEIVING BANDWITH'}
									{!spending && (
										<Caption13Up color="gray2"> (COST: $ TODO)</Caption13Up>
									)}
								</Caption13Up>
							)}
							<AmountToggle sats={amount} />
						</View>
						<ThemedView color="purple16" style={styles.iconContainer}>
							{spending ? (
								<SendIcon height={24} width={20} color="purple" />
							) : (
								<ReceiveIcon height={24} width={20} color="purple" />
							)}
						</ThemedView>
					</View>
				</View>

				{!keybrd && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Button
							text="Continue"
							size="large"
							onPress={(): void => {
								if (spending) {
									navigation.push('CustomSetup', {
										spending: false,
										spendingAmount: amount,
									});
								} else {
									navigation.navigate('CustomConfirm', {
										spendingAmount: route.params.spendingAmount,
										receivingAmount: amount,
										receivingCost: 123456,
									});
								}
							}}
						/>
						<SafeAreaInsets type="bottom" />
					</AnimatedView>
				)}

				{keybrd && (
					<NumberPadLightning
						sats={amount}
						onChange={setAmount}
						onDone={(): void => setKeybrd(false)}
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
	},
	barrels: {
		flexDirection: 'row',
		marginHorizontal: -8,
		marginBottom: 14,
	},
	bRoot: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'center',
		marginHorizontal: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	bImage: {
		margin: 8,
		height: 100,
		width: 100,
		resizeMode: 'contain',
	},
	bAmount: {
		marginTop: 8,
		marginBottom: 16,
		textAlign: 'center',
	},
	buttonCustom: {
		alignSelf: 'flex-start',
	},
	amountBig: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	iconContainer: {
		borderRadius: 32,
		overflow: 'hidden',
		height: 64,
		width: 64,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(CustomSetup);
