import React, {
	ReactElement,
	memo,
	useMemo,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Caption13Up, Display, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Barrel from './Barrel';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import NumberPadLightning from './NumberPadLightning';
import type { LightningScreenProps } from '../../navigation/types';
import { useBalance } from '../../hooks/wallet';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import {
	convertCurrency,
	convertToSats,
	fiatToBitcoinUnit,
	getFiatDisplayValues,
} from '../../utils/exchange-rate';
import { objectKeys } from '../../utils/objectKeys';
import { showErrorNotification } from '../../utils/notifications';
import { startChannelPurchase } from '../../store/actions/blocktank';
import { EBalanceUnit, EBitcoinUnit } from '../../store/types/wallet';
import {
	balanceUnitSelector,
	selectedCurrencySelector,
} from '../../store/reselect/settings';
import {
	blocktankProductIdSelector,
	blocktankServiceSelector,
} from '../../store/reselect/blocktank';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import NumberPadTextField from '../../components/NumberPadTextField';
import { getNumberPadText } from '../../utils/numberpad';
import { updateSettings } from '../../store/actions/settings';

export type TPackages = {
	id: 'small' | 'medium' | 'big';
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
	const spending = route.params.spending;
	const { t } = useTranslation('lightning');
	const currentBalance = useBalance({ onchain: true });
	const selectedCurrency = useSelector(selectedCurrencySelector);
	const productId = useSelector(blocktankProductIdSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const blocktankService = useSelector(blocktankServiceSelector);
	const unit = useSelector(balanceUnitSelector);

	const [textFieldValue, setTextFieldValue] = useState('');
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [loading, setLoading] = useState(false);
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
	const [availableSpendingPackages, setAvailableSpendingPackages] = useState<
		TPackages[]
	>([]); //Packages the user can afford.
	const [availableReceivingPackages, setAvailableReceivingPackages] = useState<
		TPackages[]
	>([]);

	const spendableFiatBalance = useMemo(() => {
		const spendableBalance = Math.round(currentBalance.fiatValue / 1.2);
		const convertedUnit = convertCurrency({
			amount: 999,
			from: 'USD',
			to: selectedCurrency,
		});
		const maxSpendingLimitSats = fiatToBitcoinUnit({
			fiatValue: convertedUnit.fiatValue,
			bitcoinUnit: EBitcoinUnit.satoshi,
		});
		const maxSpendingLimit = getFiatDisplayValues({
			satoshis: maxSpendingLimitSats,
			bitcoinUnit: EBitcoinUnit.satoshi,
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
				rates[id] = convertToSats(convertedAmount.fiatValue, EBalanceUnit.fiat);
				availPackages.push({ ...p, fiatAmount: convertedAmount.fiatValue });
			} else {
				const key = objectKeys(rates)[i];
				rates[key] = convertToSats(spendableFiatBalance, EBalanceUnit.fiat);
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
		// set initial spending amount
		const result = getNumberPadText(rates.small, unit, true);
		setTextFieldValue(result);
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
				const sats = convertToSats(
					convertedAmount.fiatValue,
					EBalanceUnit.fiat,
				);
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
				const sats = convertToSats(
					convertedAmount.fiatValue,
					EBalanceUnit.fiat,
				);
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

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		blocktankService.max_chan_receiving,
		blocktankService.max_chan_receiving_usd,
		selectedCurrency,
		spendableFiatBalance,
	]);

	// set initial receiving amount
	useEffect(() => {
		if (!spending) {
			const { big, medium, small } = receivePkgRates;
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

			const result = getNumberPadText(amount, unit, true);
			setTextFieldValue(result);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		blocktankService.max_chan_receiving,
		blocktankService.min_channel_size,
		currentBalance.satoshis,
		receivePkgRates,
		spending,
	]);

	const amount = useMemo((): number => {
		return convertToSats(textFieldValue, unit);
	}, [textFieldValue, unit]);

	const maxAmount = useMemo((): number => {
		return spending
			? currentBalance.satoshis
			: blocktankService.max_chan_receiving;
	}, [spending, currentBalance.satoshis, blocktankService.max_chan_receiving]);

	const onBarrelPress = useCallback(
		(id: TPackages['id']): void => {
			const rate = spending ? spendPkgRates[id] : receivePkgRates[id];
			const result = getNumberPadText(rate, unit, true);
			setTextFieldValue(result);
		},
		[spending, spendPkgRates, receivePkgRates, unit],
	);

	const getBarrels = useCallback((): ReactElement[] => {
		if (spending) {
			return availableSpendingPackages.map((p) => (
				<Barrel
					key={p.id}
					id={p.id}
					active={spendPkgRates[p.id] === amount}
					amount={spendPkgRates[p.id]}
					img={p.img}
					testID={`Barrel-${p.id}`}
					onPress={onBarrelPress}
				/>
			));
		} else {
			return availableReceivingPackages.map((p) => (
				<Barrel
					key={p.id}
					id={p.id}
					active={receivePkgRates[p.id] === amount}
					amount={receivePkgRates[p.id]}
					img={p.img}
					testID={`Barrel-${p.id}`}
					onPress={onBarrelPress}
				/>
			));
		}
	}, [
		availableSpendingPackages,
		availableReceivingPackages,
		receivePkgRates,
		spendPkgRates,
		onBarrelPress,
		spending,
		amount,
	]);

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
		const result = getNumberPadText(amount, nextUnit);
		setTextFieldValue(result);

		updateSettings({
			balanceUnit: nextUnit,
			...(nextUnit !== EBalanceUnit.fiat && {
				bitcoinUnit: nextUnit as unknown as EBitcoinUnit,
			}),
		});
	};

	const onMax = useCallback(() => {
		if (spending) {
			// Select highest available spend package.
			const maxSpendPackage = availableSpendingPackages.reduce((a, b) => {
				return a.fiatAmount > b.fiatAmount ? a : b;
			});
			const spendRate = spendPkgRates[maxSpendPackage.id];
			const result = getNumberPadText(spendRate, unit);
			setTextFieldValue(result);
		} else {
			// Select highest available receive package.
			const maxReceivePackage = availableReceivingPackages.reduce((a, b) => {
				return a.fiatAmount > b.fiatAmount ? a : b;
			});
			const receiveRate = receivePkgRates[maxReceivePackage.id];
			const result = getNumberPadText(receiveRate, unit);
			setTextFieldValue(result);
		}
	}, [
		spending,
		availableSpendingPackages,
		availableReceivingPackages,
		spendPkgRates,
		receivePkgRates,
		unit,
	]);

	const onDone = useCallback(() => {
		setShowNumberPad(false);
	}, []);

	const onContinue = useCallback(async (): Promise<void> => {
		if (spending) {
			// go to second setup screen
			navigation.push('CustomSetup', {
				spending: false,
				spendingAmount: amount,
			});
			return;
		}

		// Create the channel order and navigate to the confirm screen.
		setLoading(true);

		const spendingAmount = route.params.spendingAmount ?? 0;
		const receivingAmount = amount;

		const purchaseResponse = await startChannelPurchase({
			productId,
			remoteBalance: spendingAmount,
			localBalance: receivingAmount,
			channelExpiry: 6,
			selectedWallet,
			selectedNetwork,
		});
		if (purchaseResponse.isErr()) {
			let msg = purchaseResponse.error.message;
			if (msg.includes('Local channel balance is too small')) {
				t('error_channel_receiving', {
					usdValue: blocktankService.max_chan_receiving_usd,
				});
			}
			showErrorNotification({
				title: t('error_channel_purchase'),
				message: msg,
			});
			setLoading(false);
			return;
		}
		setLoading(false);

		navigation.navigate('CustomConfirm', {
			spendingAmount,
			receivingAmount,
			orderId: purchaseResponse.value,
		});
	}, [
		blocktankService,
		navigation,
		selectedNetwork,
		selectedWallet,
		productId,
		route.params.spendingAmount,
		amount,
		spending,
		t,
	]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={t('add_instant_payments')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			{/* TODO: add scrolling on small screens */}

			<View style={styles.root}>
				<View>
					<Display>
						<Trans
							t={t}
							i18nKey={spending ? 'spending_header' : 'receiving_header'}
							components={{
								purple: <Display color="purple" />,
							}}
						/>
					</Display>
					{spending && !showNumberPad && (
						<Text01S color="gray1" style={styles.text}>
							{t('spending_amount_bitcoin')}
						</Text01S>
					)}
					{spending && showNumberPad && (
						<Text01S color="gray1" style={styles.text}>
							{t('enter_money')}
						</Text01S>
					)}
					{!spending && !showNumberPad && (
						<Text01S color="gray1" style={styles.text}>
							{t('receiving_amount_money')}
						</Text01S>
					)}
					{!spending && showNumberPad && (
						<Text01S color="gray1" style={styles.text}>
							{t('receiving_amount_bitcoin')}
						</Text01S>
					)}
				</View>

				{!showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<View style={styles.barrels}>{getBarrels()}</View>
						<Button
							style={styles.buttonCustom}
							text={t('enter_custom_amount')}
							testID="CustomSetupCustomAmount"
							onPress={(): void => setShowNumberPad((k) => !k)}
						/>
					</AnimatedView>
				)}

				<View style={styles.amount}>
					{!showNumberPad && (
						<Caption13Up style={styles.amountCaption} color="purple">
							{t(spending ? 'spending_label' : 'receiving_label')}
						</Caption13Up>
					)}
					<NumberPadTextField
						value={textFieldValue}
						showPlaceholder={showNumberPad}
						reverse={true}
						testID="CustomSetupNumberField"
						onPress={(): void => setShowNumberPad(true)}
					/>
				</View>

				{!showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Button
							text={t('continue')}
							size="large"
							loading={loading}
							testID="CustomSetupContinue"
							onPress={onContinue}
						/>
						<SafeAreaInsets type="bottom" />
					</AnimatedView>
				)}

				{showNumberPad && (
					<NumberPadLightning
						style={styles.numberpad}
						value={textFieldValue}
						maxAmount={maxAmount}
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
	amount: {
		marginTop: 'auto',
		marginBottom: 32,
	},
	amountCaption: {
		marginBottom: 4,
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default memo(CustomSetup);
