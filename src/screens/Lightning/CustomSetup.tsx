import React, {
	ReactElement,
	memo,
	useMemo,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppSelector } from '../../hooks/redux';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Caption13Up, Display, Text01S } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import Barrel from './Barrel';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import NumberPadLightning from './NumberPadLightning';
import type { LightningScreenProps } from '../../navigation/types';
import { useBalance, useSwitchUnit } from '../../hooks/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import {
	convertCurrency,
	convertToSats,
	fiatToBitcoinUnit,
} from '../../utils/conversion';
import { getFiatDisplayValues } from '../../utils/displayValues';
import { showToast } from '../../utils/notifications';
import { estimateOrderFee } from '../../utils/blocktank';
import { startChannelPurchase } from '../../store/utils/blocktank';
import { EConversionUnit } from '../../store/types/wallet';
import {
	nextUnitSelector,
	unitSelector,
	selectedCurrencySelector,
	conversionUnitSelector,
	denominationSelector,
} from '../../store/reselect/settings';
import { blocktankInfoSelector } from '../../store/reselect/blocktank';
import NumberPadTextField from '../../components/NumberPadTextField';
import { getNumberPadText } from '../../utils/numberpad';
import { MAX_SPENDING_PERCENTAGE } from '../../utils/wallet/constants';
import { refreshBlocktankInfo } from '../../store/utils/blocktank';
import { lnSetupSelector } from '../../store/reselect/aggregations';
import { useDisplayValues } from '../../hooks/displayValues';

export type TPackage = {
	id: 'small' | 'medium' | 'big';
	img: ImageSourcePropType;
	fiatAmount: number;
	satoshis: number;
};

const PACKAGES_SPENDING: Omit<TPackage, 'satoshis'>[] = [
	{
		id: 'small',
		img: require('../../assets/illustrations/coin-transparent.png'),
		fiatAmount: 0,
	},
	{
		id: 'medium',
		img: require('../../assets/illustrations/coin-stack-2.png'),
		fiatAmount: 100,
	},
	{
		id: 'big',
		img: require('../../assets/illustrations/coin-stack-3.png'),
		fiatAmount: 450,
	},
];

const PACKAGES_RECEIVING: Omit<TPackage, 'satoshis'>[] = [
	{
		id: 'big',
		img: require('../../assets/illustrations/coin-stack-3.png'),
		fiatAmount: 999,
	},
	{
		id: 'medium',
		img: require('../../assets/illustrations/coin-stack-2.png'),
		fiatAmount: 500,
	},
	{
		id: 'small',
		img: require('../../assets/illustrations/coin-stack-1.png'),
		fiatAmount: 250,
	},
];

const CustomSetup = ({
	navigation,
	route,
}: LightningScreenProps<'CustomSetup'>): ReactElement => {
	const { spending, spendingAmount } = route.params;
	const { t } = useTranslation('lightning');
	const switchUnit = useSwitchUnit();
	const { onchainBalance } = useBalance();
	const { fiatValue: onchainFiatBalance } = useDisplayValues(onchainBalance);
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const selectedCurrency = useAppSelector(selectedCurrencySelector);
	const blocktankInfo = useAppSelector(blocktankInfoSelector);

	const { limits } = useAppSelector((state) => {
		return lnSetupSelector(state, spendingAmount);
	});

	const [textFieldValue, setTextFieldValue] = useState('');
	const [channelOpenFee, setChannelOpenFee] = useState<{
		[key: string]: string;
	}>({});
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [loading, setLoading] = useState(false);
	const [spendingPackages, setSpendingPackages] = useState<TPackage[]>([]); // Packages the user can afford.
	const [receivingPackages, setReceivingPackages] = useState<TPackage[]>([]);

	const maxChannelSizeSat = useMemo(() => {
		if (blocktankInfo.options.maxChannelSizeSat > 0) {
			return blocktankInfo.options.maxChannelSizeSat - (spendingAmount ?? 0);
		}
		return (
			fiatToBitcoinUnit({
				amount: 989, // 989 instead of 999 to allow for exchange rate variances.
				currency: 'USD',
			}) - (spendingAmount ?? 0)
		);
	}, [blocktankInfo.options.maxChannelSizeSat, spendingAmount]);

	useFocusEffect(
		useCallback(() => {
			const setupTransfer = async (): Promise<void> => {
				await resetSendTransaction();
				await setupOnChainTransaction();
				refreshBlocktankInfo().then();
			};
			setupTransfer();
		}, []),
	);

	useEffect(() => {
		const spendableBalanceFiat = Math.round(
			onchainFiatBalance * MAX_SPENDING_PERCENTAGE,
		);

		let reachedSpendingCap = false;
		const availSpendingPackages: TPackage[] = [];
		PACKAGES_SPENDING.every((p, i) => {
			// This ensures we have enough money to actually pay for the channel.
			if (spendableBalanceFiat > p.fiatAmount) {
				const convertedAmount = convertCurrency({
					amount: p.fiatAmount,
					from: 'USD',
					to: selectedCurrency,
				});
				const satoshis = convertToSats(
					convertedAmount.fiatValue,
					EConversionUnit.fiat,
				);
				availSpendingPackages.push({
					...p,
					fiatAmount: convertedAmount.fiatValue,
					satoshis,
				});
			} else {
				// if we can't afford a package, add a package with the maximum amount we can afford.
				const convertedAmount = convertCurrency({
					amount: PACKAGES_SPENDING[i].fiatAmount,
					from: 'USD',
					to: selectedCurrency,
				});
				availSpendingPackages.push({
					...PACKAGES_SPENDING[i],
					fiatAmount: convertedAmount.fiatValue,
					satoshis: limits.local,
				});
				reachedSpendingCap = true;
			}
			return !reachedSpendingCap;
		});
		setSpendingPackages(availSpendingPackages);

		let maxReceiving = maxChannelSizeSat;
		let minReceiving = spendingAmount! ?? 0;
		const minChannelSizeFiat = getFiatDisplayValues({
			satoshis: minReceiving,
		});
		let availReceivingPackages: TPackage[] = [];
		PACKAGES_RECEIVING.forEach((p) => {
			const maxChannelSizeFiat = getFiatDisplayValues({
				satoshis: maxReceiving,
			});

			const delta = Math.abs(maxReceiving - minReceiving);
			let packageFiatAmount = p.fiatAmount;

			// Ensure the fiatAmount is within the range of minReceiving and maxChannelSizeFiat.fiatValue
			if (packageFiatAmount > maxChannelSizeFiat.fiatValue) {
				packageFiatAmount = maxChannelSizeFiat.fiatValue;
			} else if (packageFiatAmount < minChannelSizeFiat.fiatValue) {
				packageFiatAmount = minChannelSizeFiat.fiatValue;
			}

			const satoshis = convertToSats(packageFiatAmount, EConversionUnit.fiat);
			const satoshisCapped = Math.min(satoshis, maxReceiving);

			maxReceiving = Number((maxReceiving - delta / 3).toFixed(0));
			availReceivingPackages.push({
				...p,
				fiatAmount: packageFiatAmount,
				satoshis: satoshisCapped,
			});
		});
		availReceivingPackages.sort((a, b) => a.satoshis - b.satoshis);
		setReceivingPackages(availReceivingPackages);
	}, [
		maxChannelSizeSat,
		onchainFiatBalance,
		selectedCurrency,
		spendingAmount,
		limits.local,
	]);

	// set initial spending/receiving amount
	useEffect(() => {
		if (spending && spendingPackages.length) {
			const defaultPackage = spendingPackages.find((p) => p.id === 'small')!;
			const result = getNumberPadText(
				defaultPackage.satoshis,
				denomination,
				unit,
				true,
			);
			setTextFieldValue(result);
		}

		if (!spending && receivingPackages.length) {
			const small = receivingPackages.find((p) => p.id === 'small')!;
			const medium = receivingPackages.find((p) => p.id === 'medium')!;
			const big = receivingPackages.find((p) => p.id === 'big')!;

			// Attempt to suggest a receiving balance 10x greater than current on-chain balance.
			// May not be able to afford anything much larger.
			const balanceMultiplied = onchainBalance * 10;
			const amount =
				balanceMultiplied > big.satoshis
					? big.satoshis
					: balanceMultiplied > medium.satoshis
					? medium.satoshis
					: balanceMultiplied > small.satoshis
					? small.satoshis
					: balanceMultiplied > blocktankInfo.options.minChannelSizeSat
					? blocktankInfo.options.minChannelSizeSat
					: 0;

			const result = getNumberPadText(amount, denomination, unit);
			setTextFieldValue(result);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		maxChannelSizeSat,
		blocktankInfo.options.minChannelSizeSat,
		onchainBalance,
		receivingPackages,
		spending,
	]);

	const amount = useMemo((): number => {
		return convertToSats(textFieldValue, conversionUnit);
	}, [textFieldValue, conversionUnit]);

	const maxAmount = useMemo((): number => {
		return spending ? limits.local : maxChannelSizeSat;
	}, [spending, limits.local, maxChannelSizeSat]);

	// fetch approximate channel open cost on ReceiveAmount screen
	useEffect(() => {
		if (spendingAmount === undefined) {
			return;
		}

		// if fee exists in cache, do not fetch again
		if (channelOpenFee[`${spendingAmount}-${amount}`]) {
			return;
		}

		const getChannelOpenCost = async (): Promise<void> => {
			if (amount === 0) {
				return;
			}
			const res = await estimateOrderFee({
				lspBalance: amount,
				options: {
					clientBalanceSat: spendingAmount,
					lspNodeId: blocktankInfo.nodes[0].pubkey,
					turboChannel:
						spendingAmount <= blocktankInfo.options.max0ConfClientBalanceSat,
				},
			});
			if (res.isErr()) {
				return;
			}

			const { fiatSymbol, fiatValue } = getFiatDisplayValues({
				satoshis: res.value,
			});

			setChannelOpenFee((value) => ({
				...value,
				[`${spendingAmount}-${amount}`]: `${fiatSymbol} ${fiatValue.toFixed(
					2,
				)}`,
			}));
		};

		getChannelOpenCost();
	}, [
		amount,
		spending,
		channelOpenFee,
		spendingAmount,
		blocktankInfo.nodes,
		blocktankInfo.options.max0ConfClientBalanceSat,
	]);

	const getBarrels = useCallback((): ReactElement[] => {
		const onBarrelPress = (id: TPackage['id']): void => {
			const pkg = spending
				? spendingPackages.find((p) => p.id === id)!
				: receivingPackages.find((p) => p.id === id)!;

			const result = getNumberPadText(pkg.satoshis, denomination, unit);
			setTextFieldValue(result);
		};

		if (spending) {
			return spendingPackages.map((p) => (
				<Barrel
					key={p.id}
					id={p.id}
					amount={p.satoshis}
					img={p.img}
					active={p.satoshis === amount}
					testID={`Barrel-${p.id}`}
					onPress={onBarrelPress}
				/>
			));
		} else {
			return receivingPackages.map((p) => (
				<Barrel
					key={p.id}
					id={p.id}
					amount={p.satoshis}
					img={p.img}
					active={p.satoshis === amount}
					disabled={p.satoshis <= spendingAmount!}
					testID={`Barrel-${p.id}`}
					onPress={onBarrelPress}
				/>
			));
		}
	}, [
		spendingPackages,
		receivingPackages,
		spending,
		amount,
		spendingAmount,
		denomination,
		unit,
	]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(amount, denomination, nextUnit);
		setTextFieldValue(result);
		switchUnit();
	};

	const onMax = useCallback(() => {
		if (spending) {
			// Select highest available spend package.
			const maxPackage = spendingPackages.reduce((a, b) => {
				return a.fiatAmount > b.fiatAmount ? a : b;
			});
			const result = getNumberPadText(maxPackage.satoshis, denomination, unit);
			setTextFieldValue(result);
		} else {
			// Select highest available receive package.
			const maxPackage = receivingPackages.reduce((a, b) => {
				return a.fiatAmount > b.fiatAmount ? a : b;
			});
			const result = getNumberPadText(maxPackage.satoshis, denomination, unit);
			setTextFieldValue(result);
		}
	}, [spending, spendingPackages, receivingPackages, denomination, unit]);

	const onCustomAmount = (): void => {
		setShowNumberPad(true);
		setTextFieldValue('0');
	};

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

		const purchaseResponse = await startChannelPurchase({
			clientBalance: spendingAmount!,
			lspBalance: amount,
			zeroConfPayment:
				spendingAmount! <= blocktankInfo.options.max0ConfClientBalanceSat,
		});

		setLoading(false);
		if (purchaseResponse.isErr()) {
			let msg = purchaseResponse.error.message;
			if (msg.includes('Local channel balance is too small')) {
				t('error_channel_receiving', {
					usdValue: maxChannelSizeSat,
				});
			}
			showToast({
				type: 'warning',
				title: t('error_channel_purchase'),
				description: msg,
			});
		}
		if (purchaseResponse.isOk()) {
			navigation.navigate('CustomConfirm', {
				spendingAmount: spendingAmount!,
				receivingAmount: amount,
				orderId: purchaseResponse.value.id,
			});
		}
	}, [
		t,
		spending,
		spendingAmount,
		amount,
		navigation,
		maxChannelSizeSat,
		blocktankInfo.options.max0ConfClientBalanceSat,
	]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('add_instant_payments')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			{/* TODO: add scrolling on small screens */}

			<View style={styles.root} testID="CustomSetup">
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

				{!showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<View style={styles.barrels}>{getBarrels()}</View>
						{spending && (
							<Button
								style={styles.buttonCustom}
								text={t('enter_custom_amount')}
								testID="CustomSetupCustomAmount"
								onPress={onCustomAmount}
							/>
						)}
					</AnimatedView>
				)}

				<View style={styles.amount}>
					{!showNumberPad && (
						<View style={styles.amountCaption}>
							<Caption13Up style={styles.amountCaption} color="purple">
								{t(spending ? 'spending_label' : 'receiving_label')}
							</Caption13Up>
							{channelOpenFee[`${spendingAmount}-${amount}`] && (
								<AnimatedView entering={FadeIn} exiting={FadeOut}>
									<Caption13Up style={styles.amountCaptionCost} color="gray2">
										(Cost: {channelOpenFee[`${spendingAmount}-${amount}`]})
									</Caption13Up>
								</AnimatedView>
							)}
						</View>
					)}
					<NumberPadTextField
						value={textFieldValue}
						showPlaceholder={showNumberPad}
						testID="CustomSetupNumberField"
						onPress={onChangeUnit}
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
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
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
		flexDirection: 'row',
		marginBottom: 4,
	},
	amountCaptionCost: {
		marginLeft: 2,
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default memo(CustomSetup);
