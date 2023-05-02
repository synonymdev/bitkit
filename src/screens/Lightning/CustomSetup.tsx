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
import { useSelector } from 'react-redux';
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
import { useBalance } from '../../hooks/wallet';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import {
	convertCurrency,
	convertToSats,
	getFiatDisplayValues,
} from '../../utils/exchange-rate';
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
import { DEFAULT_CHANNEL_DURATION } from './CustomConfirm';
import { SPENDING_LIMIT_RATIO } from '../../utils/wallet/constants';
import { refreshBlocktankInfo } from '../../store/actions/blocktank';

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
		fiatAmount: 500,
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
}: LightningScreenProps<'CustomSetup'>): ReactElement => {
	const { spending, spendingAmount } = route.params;
	const { t } = useTranslation('lightning');
	const unit = useSelector(balanceUnitSelector);
	const currentBalance = useBalance({ onchain: true });
	const productId = useSelector(blocktankProductIdSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedCurrency = useSelector(selectedCurrencySelector);
	const blocktankService = useSelector(blocktankServiceSelector);

	const [textFieldValue, setTextFieldValue] = useState('');
	const [channelOpenCost, setChannelOpenCost] = useState('');
	const [showNumberPad, setShowNumberPad] = useState(false);
	const [loading, setLoading] = useState(false);
	const [spendingPackages, setSpendingPackages] = useState<TPackage[]>([]); // Packages the user can afford.
	const [receivingPackages, setReceivingPackages] = useState<TPackage[]>([]);

	useFocusEffect(
		useCallback(() => {
			resetOnChainTransaction({ selectedNetwork, selectedWallet });
			setupOnChainTransaction({ selectedNetwork, selectedWallet }).then();
			refreshBlocktankInfo().then();
		}, [selectedNetwork, selectedWallet]),
	);

	useEffect(() => {
		const spendableBalance = Math.round(
			currentBalance.fiatValue * SPENDING_LIMIT_RATIO,
		);

		let reachedSpendingCap = false;
		const availSpendingPackages: TPackage[] = [];
		PACKAGES_SPENDING.every((p, i) => {
			// This ensures we have enough money to actually pay for the channel.
			if (spendableBalance > p.fiatAmount) {
				const convertedAmount = convertCurrency({
					amount: p.fiatAmount,
					from: 'USD',
					to: selectedCurrency,
				});
				const satoshis = convertToSats(
					convertedAmount.fiatValue,
					EBalanceUnit.fiat,
				);
				availSpendingPackages.push({
					...p,
					fiatAmount: convertedAmount.fiatValue,
					satoshis,
				});
			} else {
				const satoshis = convertToSats(spendableBalance, EBalanceUnit.fiat);
				const convertedAmount = convertCurrency({
					amount: PACKAGES_SPENDING[i].fiatAmount,
					from: 'USD',
					to: selectedCurrency,
				});
				availSpendingPackages.push({
					...PACKAGES_SPENDING[i],
					fiatAmount: convertedAmount.fiatValue,
					satoshis,
				});
				reachedSpendingCap = true;
			}
			return !reachedSpendingCap;
		});
		setSpendingPackages(availSpendingPackages);

		const availReceivingPackages: TPackage[] = PACKAGES_RECEIVING.map((p) => {
			if (p.fiatAmount < blocktankService.max_chan_receiving_usd) {
				const convertedAmount = convertCurrency({
					amount: p.fiatAmount,
					from: 'USD',
					to: selectedCurrency,
				});
				const satoshis = convertToSats(
					convertedAmount.fiatValue,
					EBalanceUnit.fiat,
				);
				// Ensure the conversion still puts us below the max_chan_receiving
				const satoshisCapped = Math.min(
					satoshis,
					blocktankService.max_chan_receiving,
				);

				return {
					...p,
					fiatAmount: convertedAmount.fiatValue,
					satoshis: satoshisCapped,
				};
			} else {
				const convertedAmount = convertCurrency({
					amount: blocktankService.max_chan_receiving_usd,
					from: 'USD',
					to: selectedCurrency,
				});
				const satoshis = convertToSats(
					convertedAmount.fiatValue,
					EBalanceUnit.fiat,
				);
				// Ensure the conversion still puts us below the max_chan_receiving
				const satoshisCapped = Math.min(
					satoshis,
					blocktankService.max_chan_receiving,
				);

				return {
					...p,
					fiatAmount: convertedAmount.fiatValue,
					satoshis: satoshisCapped,
				};
			}
		});
		setReceivingPackages(availReceivingPackages);
	}, [
		currentBalance.fiatValue,
		blocktankService.max_chan_receiving,
		blocktankService.max_chan_receiving_usd,
		selectedCurrency,
	]);

	// set initial spending/receiving amount
	useEffect(() => {
		if (spending && spendingPackages.length) {
			const defaultPackage = spendingPackages.find((p) => p.id === 'small')!;
			const result = getNumberPadText(defaultPackage.satoshis, unit, true);
			setTextFieldValue(result);
		}

		if (!spending && receivingPackages.length) {
			const small = receivingPackages.find((p) => p.id === 'small')!;
			const medium = receivingPackages.find((p) => p.id === 'medium')!;
			const big = receivingPackages.find((p) => p.id === 'big')!;

			// Attempt to suggest a receiving balance 10x greater than current on-chain balance.
			// May not be able to afford anything much larger.
			const balanceMultiplied = currentBalance.satoshis * 10;
			const amount =
				balanceMultiplied > big.satoshis
					? big.satoshis
					: balanceMultiplied > medium.satoshis
					? medium.satoshis
					: balanceMultiplied > small.satoshis
					? small.satoshis
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
		receivingPackages,
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

	// fetch approximate channel open cost on ReceiveAmount screen
	useEffect(() => {
		if (!spending && receivingPackages.length) {
			const defaultPackage = receivingPackages.find((p) => p.id === 'medium')!;
			const getChannelOpenCost = async (): Promise<void> => {
				const response = await startChannelPurchase({
					productId,
					remoteBalance: spendingAmount!,
					localBalance: defaultPackage.satoshis,
					channelExpiry: DEFAULT_CHANNEL_DURATION,
					selectedWallet,
					selectedNetwork,
				});
				if (response.isOk()) {
					const { fiatSymbol, fiatValue } = getFiatDisplayValues({
						satoshis: response.value.channelOpenCost,
					});
					setChannelOpenCost(`${fiatSymbol} ${fiatValue.toFixed(2)}`);
				}
			};

			getChannelOpenCost();
		}
	}, [
		spending,
		receivingPackages,
		spendingAmount,
		productId,
		selectedWallet,
		selectedNetwork,
	]);

	const getBarrels = useCallback((): ReactElement[] => {
		const onBarrelPress = (id: TPackage['id']): void => {
			const pkg = spending
				? spendingPackages.find((p) => p.id === id)!
				: receivingPackages.find((p) => p.id === id)!;

			const result = getNumberPadText(pkg.satoshis, unit);
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
		unit,
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
			const maxPackage = spendingPackages.reduce((a, b) => {
				return a.fiatAmount > b.fiatAmount ? a : b;
			});
			const result = getNumberPadText(maxPackage.satoshis, unit);
			setTextFieldValue(result);
		} else {
			// Select highest available receive package.
			const maxPackage = receivingPackages.reduce((a, b) => {
				return a.fiatAmount > b.fiatAmount ? a : b;
			});
			const result = getNumberPadText(maxPackage.satoshis, unit);
			setTextFieldValue(result);
		}
	}, [spending, spendingPackages, receivingPackages, unit]);

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
			productId,
			remoteBalance: spendingAmount!,
			localBalance: amount,
			channelExpiry: DEFAULT_CHANNEL_DURATION,
			selectedWallet,
			selectedNetwork,
		});

		setLoading(false);
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
		}
		if (purchaseResponse.isOk()) {
			navigation.navigate('CustomConfirm', {
				spendingAmount: spendingAmount!,
				receivingAmount: amount,
				orderId: purchaseResponse.value.orderId,
			});
		}
	}, [
		blocktankService,
		navigation,
		selectedNetwork,
		selectedWallet,
		productId,
		spendingAmount,
		amount,
		spending,
		t,
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
						<View style={styles.amountCaption}>
							<Caption13Up style={styles.amountCaption} color="purple">
								{t(spending ? 'spending_label' : 'receiving_label')}
							</Caption13Up>
							{channelOpenCost && (
								<Caption13Up style={styles.amountCaptionCost} color="gray1">
									(Cost: {channelOpenCost})
								</Caption13Up>
							)}
						</View>
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
