import React, {
	ReactElement,
	useState,
	useCallback,
	useMemo,
	useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

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

import { err, ok, Result } from '@synonymdev/result';
import { getNodeId } from '../../utils/lightning';
import { useSelector } from 'react-redux';
import Store from '../../store/types';
import { useBalance } from '../../hooks/wallet';
import { buyChannel } from '../../store/actions/blocktank';
import { showErrorNotification } from '../../utils/notifications';
import {
	setupOnChainTransaction,
	updateBitcoinTransaction,
} from '../../store/actions/wallet';
import { updateFee } from '../../utils/wallet/transactions';
import { getOrder } from '../../utils/blocktank';

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

const QuickSetup = ({
	navigation,
}: LightningScreenProps<'QuickSetup'>): ReactElement => {
	const colors = useColors();
	const [keybrd, setKeybrd] = useState(false);
	const [loading, setLoading] = useState(false);
	const [totalBalance, setTotalBalance] = useState(20000);
	const [spendingAmount, setSpendingAmount] = useState(0);
	const currentBalance = useBalance({ onchain: true });
	const bitcoinUnit = useSelector((state: Store) => state.settings.bitcoinUnit);
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
	const transaction = useSelector(
		(state: Store) =>
			state.wallet.wallets[selectedWallet].transaction[selectedNetwork],
	);
	const blocktankService = useSelector(
		(state: Store) => state.blocktank.serviceList[0],
	);
	const savingsAmount = totalBalance - spendingAmount;
	const spendingPercentage = Math.round((spendingAmount / totalBalance) * 100);
	const savingsPercentage = Math.round((savingsAmount / totalBalance) * 100);

	const handleChange = useCallback((v) => {
		setSpendingAmount(Math.round(v));
	}, []);

	const startChannelPurchase = async (): Promise<Result<string>> => {
		const nodeId = await getNodeId();
		if (nodeId.isErr()) {
			return err(nodeId.error.message);
		}
		if (!productId) {
			return err('Unable to retrieve Blocktank product id.');
		}

		const local_balance =
			spendingAmount * 2 > blocktankService.min_channel_size
				? spendingAmount * 2
				: blocktankService.min_channel_size;

		const buyChannelData = {
			product_id: productId,
			remote_balance: spendingAmount,
			local_balance,
			channel_expiry: 12,
		};
		const buyChannelResponse = await buyChannel(buyChannelData);
		if (buyChannelResponse.isErr()) {
			return err(buyChannelResponse.error.message);
		}

		const orderData = await getOrder(buyChannelResponse.value.order_id);
		if (orderData.isErr()) {
			showErrorNotification({
				title: 'Unable To Retrieve Order Information.',
				message: orderData.error.message,
			});
			return err(orderData.error.message);
		}

		await updateBitcoinTransaction({
			transaction: {
				rbf: false,
				outputs: [
					{
						value: buyChannelResponse.value.price,
						index: 0,
						address: buyChannelResponse.value.btc_address,
					},
				],
			},
		});

		// Set fee appropriately to open an instant channel.
		const zero_conf_satvbyte = orderData.value.zero_conf_satvbyte;
		await updateFee({ satsPerByte: zero_conf_satvbyte, selectedNetwork });

		// Ensure we have enough funds to pay for both the channel and the fee to broadcast the transaction.
		if (
			(transaction?.fee ?? 0) + (buyChannelResponse.value?.price ?? 0) >
			currentBalance.satoshis
		) {
			// TODO: Attempt to re-calculate a lower fee channel-open that's not instant if unable to pay.
			const delta = Math.abs(
				(transaction?.fee ?? 0) +
					(buyChannelResponse.value?.price ?? 0) -
					currentBalance.satoshis,
			);
			showErrorNotification({
				title: 'Not Enough Funds',
				message: `You need ${delta} more sats to complete this transaction.`,
			});
			return err('');
		}

		return ok(buyChannelResponse.value.order_id);
	};

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
		let spendingLimit = currentBalance.satoshis;
		if (blocktankService?.max_chan_spending < currentBalance.satoshis) {
			spendingLimit = blocktankService?.max_chan_spending;
		}
		setTotalBalance(spendingLimit);
	}, [blocktankService?.max_chan_spending, currentBalance.satoshis]);
	useEffect(() => {
		setupOnChainTransaction({ rbf: false }).then();
	}, []);

	return (
		<GlowingBackground topLeft={colors.purple}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Add Instant Payments"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.root}>
				<View>
					{keybrd ? (
						<Display color="purple">Spending Money.</Display>
					) : (
						<Display color="purple">Spending Balance.</Display>
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
								onPress={async (): Promise<void> => {
									setLoading(true);
									const purchaseResponse = await startChannelPurchase();
									if (purchaseResponse.isErr()) {
										showErrorNotification({
											title: 'Unable to retrieve channel information.',
											message: purchaseResponse.error.message,
										});
										setLoading(false);
										return;
									}
									setLoading(false);
									navigation.push('QuickConfirm', {
										spendingAmount,
										total: totalBalance,
										orderId: purchaseResponse.value,
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
	pRoot: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	pText: {
		marginLeft: 8,
	},
	numberpad: {
		marginHorizontal: -16,
	},
});

export default QuickSetup;
