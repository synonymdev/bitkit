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
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView, AnimatedView } from '../../styles/components';
import { Caption13Up, Display, BodyM } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import Barrel from '../../components/Barrel';
import NavigationHeader from '../../components/NavigationHeader';
import TransferTextField from '../../components/TransferTextField';
import Button from '../../components/buttons/Button';
import NumberPadLightning from './NumberPadLightning';
import type { TransferScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/redux';
import { useDisplayValues } from '../../hooks/displayValues';
import { useBalance, useSwitchUnit } from '../../hooks/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import { convertCurrency, convertToSats } from '../../utils/conversion';
import { getFiatDisplayValues } from '../../utils/displayValues';
import { showToast } from '../../utils/notifications';
import { getNumberPadText } from '../../utils/numberpad';
import { estimateOrderFee } from '../../utils/blocktank';
import { MAX_SPENDING_PERCENTAGE } from '../../utils/wallet/constants';
import { EConversionUnit } from '../../store/types/wallet';
import { channelsSizeSelector } from '../../store/reselect/lightning';
import { blocktankInfoSelector } from '../../store/reselect/blocktank';
import {
	startChannelPurchase,
	refreshBlocktankInfo,
} from '../../store/utils/blocktank';
import {
	nextUnitSelector,
	unitSelector,
	selectedCurrencySelector,
	conversionUnitSelector,
	denominationSelector,
} from '../../store/reselect/settings';

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
		id: 'small',
		img: require('../../assets/illustrations/coin-stack-1.png'),
		fiatAmount: 250,
	},
	{
		id: 'medium',
		img: require('../../assets/illustrations/coin-stack-2.png'),
		fiatAmount: 500,
	},
	{
		id: 'big',
		img: require('../../assets/illustrations/coin-stack-3.png'),
		fiatAmount: 999,
	},
];

const CustomSetup = ({
	navigation,
	route,
}: TransferScreenProps<'CustomSetup'>): ReactElement => {
	const { spending, spendingAmount = 0 } = route.params;
	const { t } = useTranslation('lightning');
	const switchUnit = useSwitchUnit();
	const { onchainBalance, lightningBalance } = useBalance();
	const { fiatValue: onchainFiatBalance } = useDisplayValues(onchainBalance);
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const selectedCurrency = useAppSelector(selectedCurrencySelector);
	const blocktankInfo = useAppSelector(blocktankInfoSelector);
	const channelsSize = useAppSelector(channelsSizeSelector);

	const [textFieldValue, setTextFieldValue] = useState('');
	const [channelOpenFee, setChannelOpenFee] = useState<{
		[key: string]: string;
	}>({});
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [loading, setLoading] = useState(false);
	const [spendingPackages, setSpendingPackages] = useState<TPackage[]>([]); // Packages the user can afford.
	const [receivingPackages, setReceivingPackages] = useState<TPackage[]>([]);

	// Calculate limits
	const { maxChannelSizeSat } = blocktankInfo.options;

	const localLimit = Math.round(onchainBalance * MAX_SPENDING_PERCENTAGE);
	// The maximum channel size the user can open including existing channels
	const maxChannelSize = Math.max(0, maxChannelSizeSat - channelsSize);
	const minLspBalance = Math.round(maxChannelSize / 2);
	const maxClientBalance = Math.min(localLimit, minLspBalance);
	const maxLspBalance = maxChannelSize - spendingAmount;

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
		let reachedSpendingCap = false;
		const availSpendingPackages: TPackage[] = [];
		const maxClientBalanceFiat = getFiatDisplayValues({
			satoshis: maxClientBalance,
		});

		PACKAGES_SPENDING.every((p, i) => {
			// Ensure we have enough onchain to actually pay for the channel
			if (p.fiatAmount < maxClientBalanceFiat.fiatValue) {
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
				availSpendingPackages.push({
					...PACKAGES_SPENDING[i],
					fiatAmount: maxClientBalanceFiat.fiatValue,
					satoshis: maxClientBalance,
				});
				reachedSpendingCap = true;
			}
			return !reachedSpendingCap;
		});
		setSpendingPackages(availSpendingPackages);

		const availReceivingPackages: TPackage[] = [];
		// LSP balance must be at least half the channel size
		const minReceiving = spendingAmount;
		const minLspBalanceFiat = getFiatDisplayValues({ satoshis: minReceiving });
		const maxLspBalanceFiat = getFiatDisplayValues({ satoshis: maxLspBalance });
		let reachedReceivingCap = false;

		PACKAGES_RECEIVING.forEach((p) => {
			let fiatAmount = p.fiatAmount;

			// Ensure amount is above minimum LSP balance
			if (fiatAmount < minLspBalanceFiat.fiatValue) {
				fiatAmount = minLspBalanceFiat.fiatValue;
			}

			let satoshis = convertToSats(fiatAmount, EConversionUnit.fiat);

			// Ensure amount is below maximum LSP balance
			if (fiatAmount > maxLspBalanceFiat.fiatValue && !reachedReceivingCap) {
				fiatAmount = maxLspBalanceFiat.fiatValue;
				satoshis = maxLspBalance;
				reachedReceivingCap = true;
			}

			availReceivingPackages.push({ ...p, fiatAmount, satoshis });
		});
		setReceivingPackages(availReceivingPackages);
	}, [
		maxClientBalance,
		maxLspBalance,
		onchainFiatBalance,
		selectedCurrency,
		spendingAmount,
		localLimit,
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
			// Pre-select largest receiving balance possible
			const largest = receivingPackages.findLast((p) => {
				return p.satoshis <= maxLspBalance;
			});
			const result = getNumberPadText(largest!.satoshis, denomination, unit);
			setTextFieldValue(result);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [spending, spendingPackages, receivingPackages, maxLspBalance]);

	const amount = useMemo((): number => {
		return convertToSats(textFieldValue, conversionUnit);
	}, [textFieldValue, conversionUnit]);

	const maxAmount = useMemo((): number => {
		return spending ? maxClientBalance : maxLspBalance;
	}, [spending, maxClientBalance, maxLspBalance]);

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
					disabled={p.satoshis > maxLspBalance}
					testID={`Barrel-${p.id}`}
					onPress={onBarrelPress}
				/>
			));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		spending,
		spendingPackages,
		receivingPackages,
		amount,
		spendingAmount,
		maxLspBalance,
	]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(amount, denomination, nextUnit);
		setTextFieldValue(result);
		switchUnit();
	};

	const onMax = useCallback(() => {
		if (spending) {
			// Select largest available spending package.
			const maxPackage = spendingPackages.reduce((a, b) => {
				return a.fiatAmount > b.fiatAmount ? a : b;
			});
			const result = getNumberPadText(maxPackage.satoshis, denomination, unit);
			setTextFieldValue(result);
		} else {
			// Select largest available receive package.
			const largest = receivingPackages.findLast((p) => {
				return p.satoshis <= maxLspBalance;
			});
			const result = getNumberPadText(largest!.satoshis, denomination, unit);
			setTextFieldValue(result);
		}
	}, [
		spending,
		spendingPackages,
		receivingPackages,
		maxLspBalance,
		denomination,
		unit,
	]);

	const onCustomAmount = (): void => {
		setShowNumberPad(true);
		setTextFieldValue('0');
	};

	const onDone = useCallback(() => {
		setShowNumberPad(false);
	}, []);

	const onSwitch = (): void => {
		navigation.replace('QuickSetup');
	};

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
			showToast({
				type: 'warning',
				title: t('error_channel_purchase'),
				description: msg.includes('Local channel balance is too small')
					? t('error_channel_receiving', { usdValue: maxLspBalance })
					: t('error_channel_setup_msg', { raw: msg }),
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
		maxLspBalance,
		blocktankInfo.options.max0ConfClientBalanceSat,
	]);

	const title = spending ? 'transfer.title_numpad' : 'transfer.title_receive';
	const spendingLabel = lightningBalance
		? t('spending_label_additional')
		: t('spending_label');
	const receivingLabel = lightningBalance
		? t('receiving_label_additional')
		: t('receiving_label');
	const label = spending ? spendingLabel : receivingLabel;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			<View style={styles.content} testID="CustomSetup">
				<Display>
					<Trans
						t={t}
						i18nKey={title}
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
				{spending && !showNumberPad && (
					<BodyM color="secondary" style={styles.text}>
						{t('spending_amount_bitcoin')}
					</BodyM>
				)}
				{spending && showNumberPad && (
					<BodyM color="secondary" style={styles.text}>
						{t('enter_money')}
					</BodyM>
				)}
				{!spending && !showNumberPad && (
					<BodyM color="secondary" style={styles.text}>
						{t('receiving_amount_money')}
					</BodyM>
				)}
				{!spending && showNumberPad && (
					<BodyM color="secondary" style={styles.text}>
						{t('receiving_amount_bitcoin')}
					</BodyM>
				)}

				{!showNumberPad && (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<View style={styles.barrels}>{getBarrels()}</View>
						<Button
							style={styles.buttonCustom}
							text={t('enter_custom_amount')}
							testID="CustomSetupCustomAmount"
							onPress={onCustomAmount}
						/>
					</AnimatedView>
				)}

				<View style={styles.amountContainer}>
					{!showNumberPad && (
						<View style={styles.amountLabel}>
							<Caption13Up color="purple">{label}</Caption13Up>
							{channelOpenFee[`${spendingAmount}-${amount}`] && (
								<AnimatedView entering={FadeIn} exiting={FadeOut}>
									<Caption13Up style={styles.amountCaptionCost} color="gray2">
										{t('cost', {
											amount: channelOpenFee[`${spendingAmount}-${amount}`],
										})}
									</Caption13Up>
								</AnimatedView>
							)}
						</View>
					)}
					<TransferTextField
						value={textFieldValue}
						showPlaceholder={showNumberPad}
						testID="CustomSetupNumberField"
						onPress={onChangeUnit}
					/>
				</View>

				{!showNumberPad && (
					<AnimatedView
						style={styles.buttonContainer}
						color="transparent"
						entering={FadeIn}
						exiting={FadeOut}>
						<Button
							style={styles.button}
							text={t('quick_setup')}
							size="large"
							variant="secondary"
							testID="TransferAdvanced"
							onPress={onSwitch}
						/>
						<Button
							style={styles.button}
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
						minAmount={spending ? 0 : minLspBalance}
						maxAmount={maxAmount}
						onChange={setTextFieldValue}
						onChangeUnit={onChangeUnit}
						onMax={onMax}
						onDone={onDone}
					/>
				)}
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
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
		// avoid layout shift on loading
		minHeight: 147,
	},
	buttonCustom: {
		alignSelf: 'flex-start',
	},
	amountContainer: {
		marginTop: 'auto',
	},
	amountLabel: {
		flexDirection: 'row',
		marginBottom: 16,
	},
	amountCaptionCost: {
		marginLeft: 2,
	},
	numberpad: {
		marginTop: 16,
		marginHorizontal: -16,
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 16,
		marginTop: 42,
	},
	button: {
		flex: 1,
	},
});

export default memo(CustomSetup);
