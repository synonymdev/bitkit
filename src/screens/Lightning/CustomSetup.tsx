import React, {
	ReactElement,
	memo,
	useMemo,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
	AnimatedView,
	Caption13Up,
	Display,
	Text01S,
} from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Barrel from './Barrel';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import { useExchangeRate } from '../../hooks/displayValues';
import AmountToggle from '../../components/AmountToggle';
import NumberPadLightning from './NumberPadLightning';
import type { LightningScreenProps } from '../../navigation/types';
import Store from '../../store/types';
import { useBalance } from '../../hooks/wallet';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import {
	fiatToBitcoinUnit,
	getFiatDisplayValues,
} from '../../utils/exchange-rate';
import { btcToSats } from '../../utils/helpers';
import { showErrorNotification } from '../../utils/notifications';
import { startChannelPurchase } from '../../store/actions/blocktank';
import { convertCurrency } from '../../utils/blocktank';
import { useFocusEffect } from '@react-navigation/native';

type TPackages = {
	id: string;
	fiatAmount: number;
	img: any;
};
const PACKAGES_SPENDING: TPackages[] = [
	{
		id: 'small',
		fiatAmount: 0,
		img: require('../../assets/illustrations/coin-transparent.png'),
	},
	{
		id: 'medium',
		fiatAmount: 500,
		img: require('../../assets/illustrations/coin-stack-2.png'),
	},
	{
		id: 'big',
		fiatAmount: 999,
		img: require('../../assets/illustrations/coin-stack-3.png'),
	},
];

const PACKAGES_RECEIVING: TPackages[] = [
	{
		id: 'small',
		fiatAmount: 250,
		img: require('../../assets/illustrations/coin-stack-1.png'),
	},
	{
		id: 'medium',
		fiatAmount: 500,
		img: require('../../assets/illustrations/coin-stack-2.png'),
	},
	{
		id: 'big',
		fiatAmount: 999,
		img: require('../../assets/illustrations/coin-stack-3.png'),
	},
];

const CustomSetup = ({
	navigation,
	route,
}: LightningScreenProps<'CustomSetup'>): ReactElement => {
	const [loading, setLoading] = useState(false);
	const currentBalance = useBalance({ onchain: true });
	const bitcoinUnit = useSelector((state: Store) => state.settings.bitcoinUnit);
	const selectedCurrency = useSelector(
		(state: Store) => state.settings.selectedCurrency,
	);

	const spending = route.params?.spending;
	const [keybrd, setKeybrd] = useState(false);
	const [keybrdWasEverOpened, setKeybrdWasEverOpened] = useState(false);
	const [spendingAmount, setSpendingAmount] = useState(0);
	const [receivingAmount, setReceivingAmount] = useState(0);
	const [spendPkgRates, setSpendPkgRates] = useState({
		big: 0,
		medium: 0,
		small: 0,
	});
	const [receivePkgRates, setReceivePkgRates] = useState({
		big: 0,
		medium: 0,
		small: 0,
	});
	const fiatCurrencyRate = useExchangeRate(selectedCurrency);

	const [availableSpendingPackages, setAvailableSpendingPackages] = useState<
		TPackages[]
	>([]); //Packages the user can afford.
	const [availableReceivingPackages, setAvailableReceivingPackages] = useState<
		TPackages[]
	>([]);

	const productId = useSelector(
		(state: Store) => state.blocktank?.serviceList[0]?.product_id ?? '',
	);
	const unitPreference = useSelector(
		(state: Store) => state.settings.unitPreference,
	);
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const blocktankService = useSelector(
		(state: Store) => state.blocktank.serviceList[0],
	);

	const unit = useMemo(() => {
		if (unitPreference === 'fiat') {
			return 'fiat';
		}
		if (bitcoinUnit === 'BTC') {
			return 'BTC';
		}
		return 'satoshi';
	}, [bitcoinUnit, unitPreference]);

	const fiatToSats = useCallback(
		(fiatValue = 0): number => {
			return fiatToBitcoinUnit({
				fiatValue,
				exchangeRate: fiatCurrencyRate,
				currency: selectedCurrency,
				bitcoinUnit: 'satoshi',
			});
		},
		[fiatCurrencyRate, selectedCurrency],
	);

	const spendableFiatBalance = useMemo(() => {
		const spendableBalance = Math.round(currentBalance.fiatValue / 1.2);
		const convertedUnit = convertCurrency({
			amount: 999,
			from: 'USD',
			to: selectedCurrency,
		});
		const maxSpendingLimitSats =
			fiatToBitcoinUnit({
				fiatValue: convertedUnit.fiatValue,
				bitcoinUnit: 'satoshi',
			}) ?? 0;
		const maxSpendingLimit = getFiatDisplayValues({
			satoshis: maxSpendingLimitSats,
			bitcoinUnit: 'satoshi',
			currency: selectedCurrency,
		});
		if (!maxSpendingLimit) {
			return spendableBalance;
		}
		return spendableBalance < maxSpendingLimit.fiatValue
			? spendableBalance
			: maxSpendingLimit.fiatValue;
	}, [currentBalance.fiatValue, selectedCurrency]);

	useFocusEffect(
		useCallback(() => {
			resetOnChainTransaction({ selectedNetwork, selectedWallet });
			setupOnChainTransaction({
				selectedNetwork,
				selectedWallet,
				rbf: false,
			}).then();
		}, [selectedNetwork, selectedWallet]),
	);

	useEffect(() => {
		const rates = { small: 0, medium: 0, big: 0 };
		const receiveRates = { small: 0, medium: 0, big: 0 };

		let availPackages: TPackages[] = [];
		let reachedSpendingCap = false;
		PACKAGES_SPENDING.every((p, i) => {
			const { id, fiatAmount } = p;
			// This ensures we have enough money to actually pay for the channel.
			if (spendableFiatBalance > fiatAmount) {
				const convertedAmount = convertCurrency({
					amount: p.fiatAmount,
					from: 'USD',
					to: selectedCurrency,
				});
				rates[id] = fiatToSats(convertedAmount.fiatValue);
				availPackages.push({ ...p, fiatAmount: convertedAmount.fiatValue });
			} else {
				const key = Object.keys(rates)[i];
				rates[key] = fiatToSats(spendableFiatBalance);
				const convertedAmount = convertCurrency({
					amount: PACKAGES_SPENDING[i].fiatAmount,
					from: 'USD',
					to: selectedCurrency,
				});
				availPackages.push({
					...PACKAGES_SPENDING[i],
					fiatAmount: convertedAmount.fiatValue,
				});
				reachedSpendingCap = true;
			}
			return !reachedSpendingCap;
		});
		setSpendingAmount(rates.small);
		setAvailableSpendingPackages(availPackages);
		setSpendPkgRates(rates);

		let availReceivingPackages: TPackages[] = [];
		PACKAGES_RECEIVING.forEach((p) => {
			const { id, fiatAmount } = p;
			if (fiatAmount < blocktankService.max_chan_receiving_usd) {
				const convertedAmount = convertCurrency({
					amount: fiatAmount,
					from: 'USD',
					to: selectedCurrency,
				});
				const sats = fiatToSats(convertedAmount.fiatValue);
				// Ensure the conversion still puts us below the max_chan_receiving
				receiveRates[id] =
					sats > blocktankService.max_chan_receiving
						? blocktankService.max_chan_receiving
						: sats;
				availReceivingPackages.push({
					...p,
					fiatAmount: convertedAmount.fiatValue,
				});
			} else {
				const convertedAmount = convertCurrency({
					amount: blocktankService.max_chan_receiving_usd,
					from: 'USD',
					to: selectedCurrency,
				});
				const sats = fiatToSats(convertedAmount.fiatValue);
				// Ensure the conversion still puts us below the max_chan_receiving
				receiveRates[id] =
					sats > blocktankService.max_chan_receiving
						? blocktankService.max_chan_receiving
						: sats;
				availReceivingPackages.push({
					...p,
					fiatAmount: convertedAmount.fiatValue,
				});
			}
		});
		setAvailableReceivingPackages(availReceivingPackages);
		setReceivePkgRates(receiveRates);
	}, [
		blocktankService.max_chan_receiving,
		blocktankService.max_chan_receiving_usd,
		fiatToSats,
		selectedCurrency,
		spendableFiatBalance,
	]);

	useEffect(() => {
		if (spending) {
			setSpendingAmount(0);
		} else {
			const { big = 0, medium = 0, small = 0 } = receivePkgRates;
			// Attempt to suggest a receiving balance 10x greater than current on-chain balance.
			// May not be able to afford anything much larger.
			const balanceMultiplied = currentBalance.satoshis * 10;
			const amount =
				balanceMultiplied > big
					? big
					: balanceMultiplied > medium
					? medium
					: balanceMultiplied > small
					? small
					: balanceMultiplied > blocktankService.min_channel_size
					? blocktankService.min_channel_size
					: 0;
			setReceivingAmount(amount);
		}
	}, [
		blocktankService.max_chan_receiving,
		blocktankService.min_channel_size,
		currentBalance.satoshis,
		receivePkgRates,
		spending,
	]);

	// set amount to 0 when user tries to enter custom amount at the first time
	useEffect(() => {
		if (keybrdWasEverOpened || !keybrd) {
			return;
		}
		setKeybrdWasEverOpened(true);
		if (spending) {
			setSpendingAmount(0);
		} else {
			setReceivingAmount(0);
		}
	}, [keybrd, keybrdWasEverOpened, spending]);

	const handleBarrelPress = (id): void => {
		if (spending) {
			setSpendingAmount(spendPkgRates[id]);
		} else {
			setReceivingAmount(receivePkgRates[id]);
		}
	};

	const amount = useMemo(() => {
		return spending ? spendingAmount : receivingAmount;
	}, [receivingAmount, spending, spendingAmount]);

	const getBarrels = useCallback((): ReactElement[] => {
		if (spending) {
			return availableSpendingPackages.map((p) => (
				<Barrel
					key={p.id}
					id={p.id}
					active={spendPkgRates[p.id] === spendingAmount}
					amount={spendPkgRates[p.id]}
					img={p.img}
					onPress={handleBarrelPress}
				/>
			));
		} else {
			return availableReceivingPackages.map((p) => (
				<Barrel
					key={p.id}
					id={p.id}
					active={receivePkgRates[p.id] === receivingAmount}
					amount={receivePkgRates[p.id]}
					img={p.img}
					onPress={handleBarrelPress}
				/>
			));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		availableReceivingPackages,
		availableSpendingPackages,
		receivePkgRates,
		receivingAmount,
		spendPkgRates,
		spending,
		spendingAmount,
	]);

	const onMaxPress = useCallback(() => {
		if (spending) {
			// Select highest available spend package.
			const maxSpendPackage = availableSpendingPackages.reduce((a, b) =>
				a.fiatAmount > b.fiatAmount ? a : b,
			);
			const spendRate = spendPkgRates[maxSpendPackage.id];
			setSpendingAmount(spendRate);
		} else {
			// Select highest available receive package.
			const maxReceivePackage = availableReceivingPackages.reduce((a, b) =>
				a.fiatAmount > b.fiatAmount ? a : b,
			);
			const receiveRate = receivePkgRates[maxReceivePackage.id];
			setReceivingAmount(receiveRate);
		}
	}, [
		availableReceivingPackages,
		availableSpendingPackages,
		receivePkgRates,
		spendPkgRates,
		spending,
	]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Add Instant Payments"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>

			{/* TODO: add scrolling on small screens */}

			<View style={styles.root}>
				<View>
					<Display>
						{spending ? '1) ' : '2) '}
						<Display color="purple">
							{spending ? 'Spending Money.' : 'Receiving Money.'}
						</Display>
					</Display>
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
						<View style={styles.barrels}>{getBarrels()}</View>
						<Button
							text="Enter Custom Amount"
							style={styles.buttonCustom}
							onPress={(): void => setKeybrd((k) => !k)}
						/>
					</AnimatedView>
				)}

				<View style={styles.amountBig}>
					<View>
						{!keybrd && (
							<Caption13Up style={styles.amountTitle} color="purple">
								{spending ? 'SPENDING BALANCE' : 'RECEIVING CAPACITY'}
							</Caption13Up>
						)}
						<AmountToggle
							sats={amount}
							unit="fiat"
							onPress={(): void => setKeybrd((k) => !k)}
						/>
					</View>
				</View>

				{!keybrd && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Button
							text="Continue"
							size="large"
							loading={loading}
							onPress={async (): Promise<void> => {
								if (spending) {
									// go to second setup screen
									navigation.push('CustomSetup', {
										spending: false,
										spendingAmount,
									});
								} else {
									// Create the channel order and navigate to the confirm screen.
									setLoading(true);
									const purchaseResponse = await startChannelPurchase({
										productId,
										remoteBalance: route.params.spendingAmount ?? 0,
										localBalance: receivingAmount,
										channelExpiry: 6,
										selectedWallet,
										selectedNetwork,
									});
									if (purchaseResponse.isErr()) {
										let msg = purchaseResponse.error.message;
										if (msg.includes('Local channel balance is too small')) {
											msg = `Receiving amount needs to be greater than $${blocktankService.max_chan_receiving_usd}`;
										}
										showErrorNotification({
											title: 'Channel Purchase Error',
											message: msg,
										});
										setLoading(false);
										return;
									}
									setLoading(false);

									navigation.navigate('CustomConfirm', {
										spendingAmount: route.params.spendingAmount ?? 0,
										receivingAmount,
										orderId: purchaseResponse.value,
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
						onChange={(txt): void => {
							if (spending) {
								setSpendingAmount(txt);
							} else {
								setReceivingAmount(txt);
							}
						}}
						onMaxPress={onMaxPress}
						onDone={(): void => {
							let typedAmountInSats = amount;
							if (unit === 'BTC') {
								typedAmountInSats = btcToSats(typedAmountInSats);
							}
							if (spending && typedAmountInSats > currentBalance.satoshis) {
								onMaxPress();
							}
							if (
								!spending &&
								typedAmountInSats > blocktankService.max_chan_receiving
							) {
								onMaxPress();
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
		marginTop: 8,
		marginBottom: 16,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 8,
		marginBottom: 8,
	},
	barrels: {
		flexDirection: 'row',
		marginHorizontal: -8,
		marginTop: 32,
		marginBottom: 16,
	},
	buttonCustom: {
		alignSelf: 'flex-start',
	},
	amountBig: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 'auto',
		marginBottom: 32,
	},
	amountTitle: {
		marginBottom: 8,
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default memo(CustomSetup);
