import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
	useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRoute } from '@react-navigation/native';

import { TouchableOpacity } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import { IColors } from '../../../styles/colors';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Money from '../../../components/Money';
import ContactImage from '../../../components/ContactImage';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SendNumberPad from './SendNumberPad';
import Button from '../../../components/Button';
import UnitButton from '../UnitButton';
import {
	getTransactionOutputValue,
	getMaxSendAmount,
	sendMax,
	updateSendAmount,
} from '../../../utils/wallet/transactions';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionMaxSelector,
	transactionSelector,
	utxosSelector,
} from '../../../store/reselect/wallet';
import {
	unitSelector,
	coinSelectAutoSelector,
	denominationSelector,
	conversionUnitSelector,
	nextUnitSelector,
} from '../../../store/reselect/settings';
import { useAppSelector } from '../../../hooks/redux';
import { useBalance, useSwitchUnit } from '../../../hooks/wallet';
import {
	setupFeeForOnChainTransaction,
	setupOnChainTransaction,
	updateSendTransaction,
} from '../../../store/actions/wallet';
import { getNumberPadText } from '../../../utils/numberpad';
import { showToast } from '../../../utils/notifications';
import { convertToSats } from '../../../utils/conversion';
import { TRANSACTION_DEFAULTS } from '../../../utils/wallet/constants';
import type { SendScreenProps } from '../../../navigation/types';

const Amount = ({ navigation }: SendScreenProps<'Amount'>): ReactElement => {
	const route = useRoute();
	const { t } = useTranslation('wallet');
	const switchUnit = useSwitchUnit();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const coinSelectAuto = useAppSelector(coinSelectAutoSelector);
	const transaction = useAppSelector(transactionSelector);
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const isMaxSendAmount = useAppSelector(transactionMaxSelector);
	const [text, setText] = useState('');
	const [error, setError] = useState(false);
	const utxos = useAppSelector(utxosSelector);
	const { onchainBalance } = useBalance();

	const outputAmount = useMemo(() => {
		return getTransactionOutputValue({
			outputs: transaction.outputs,
		});
	}, [transaction.outputs]);

	const availableAmount = useMemo(() => {
		const maxAmountResponse = getMaxSendAmount({
			selectedWallet,
			selectedNetwork,
		});
		if (maxAmountResponse.isOk()) {
			return maxAmountResponse.value.amount;
		}
		return 0;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		transaction.outputs,
		transaction.satsPerByte,
		selectedWallet,
		selectedNetwork,
	]);

	useFocusEffect(
		useCallback(() => {
			// This is triggered when the user removes all inputs from the coin selection screen.
			if (
				!transaction.lightningInvoice &&
				onchainBalance > TRANSACTION_DEFAULTS.dustLimit &&
				(availableAmount === 0 || !transaction.inputs.length)
			) {
				const output = { ...transaction.outputs[0], amount: 0 };
				setupOnChainTransaction({
					utxos,
					satsPerByte: transaction.satsPerByte,
					outputs: [output],
					rbf: true,
				});
				const result = getNumberPadText(0, denomination, unit);
				setText(result);
			}
		}, [
			availableAmount,
			onchainBalance,
			transaction.inputs.length,
			transaction.lightningInvoice,
			transaction.outputs,
			transaction.satsPerByte,
			denomination,
			unit,
			utxos,
		]),
	);

	// Set initial text for NumberPadTextField
	useEffect(() => {
		const result = getNumberPadText(outputAmount, denomination, unit);
		setText(result);
		// Only update this if the outputs/wallet/network changes, so we can ignore unit in the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, outputAmount, selectedWallet, selectedNetwork]);

	const amount = useMemo((): number => {
		return convertToSats(text, conversionUnit);
	}, [text, conversionUnit]);

	const availableAmountProps = {
		...(error && { color: 'brand' as keyof IColors }),
	};

	// Unset isMaxSendAmount after edit
	useEffect(() => {
		if (transaction?.lightningInvoice) {
			return;
		}
		if (isMaxSendAmount && amount !== availableAmount) {
			updateSendTransaction({ transaction: { max: false } });
		}

		if (!isMaxSendAmount && amount === availableAmount) {
			updateSendTransaction({ transaction: { max: true } });
		}
	}, [isMaxSendAmount, amount, availableAmount, transaction?.lightningInvoice]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(amount, denomination, nextUnit);
		setText(result);
		switchUnit();
	};

	const onMaxAmount = useCallback((): void => {
		if (!transaction.lightningInvoice) {
			const result = getNumberPadText(availableAmount, denomination, unit);
			setText(result);
		}
		sendMax({ selectedWallet, selectedNetwork });
	}, [
		availableAmount,
		selectedNetwork,
		selectedWallet,
		transaction.lightningInvoice,
		denomination,
		unit,
	]);

	const onError = (): void => {
		setError(true);
		setTimeout(() => setError(false), 500);
	};

	const onContinue = useCallback((): void => {
		const result = updateSendAmount({
			amount,
			selectedWallet,
			selectedNetwork,
			transaction,
		});
		if (result.isErr()) {
			showToast({
				type: 'warning',
				title: t('send_amount_error_title'),
				description: result.error.message,
			});
			return;
		}

		// If auto coin-select is disabled and there is no lightning invoice.
		if (!coinSelectAuto && !transaction.lightningInvoice) {
			navigation.navigate('CoinSelection');
		} else {
			if (!transaction.lightningInvoice) {
				const feeSetupRes = setupFeeForOnChainTransaction();
				if (feeSetupRes.isErr()) {
					showToast({
						type: 'warning',
						title: t('send_output_to_small_title'),
						description: t('send_output_to_small_description'),
					});
					return;
				}
			}
			navigation.navigate('ReviewAndSend');
		}
	}, [
		amount,
		selectedWallet,
		selectedNetwork,
		coinSelectAuto,
		transaction,
		navigation,
		t,
	]);

	const isValid = useMemo(() => {
		if (amount === 0) {
			return false;
		}

		// onchain tx
		if (!transaction.lightningInvoice) {
			// amount is below dust limit
			if (amount <= TRANSACTION_DEFAULTS.dustLimit) {
				return false;
			}

			// amount is above availableAmount
			if (amount > availableAmount) {
				return false;
			}
		}

		return true;
	}, [amount, transaction.lightningInvoice, availableAmount]);

	const canGoBack = navigation.getState().routes[0]?.key !== route.key;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('send_amount')}
				displayBackButton={canGoBack}
				actionIcon={
					transaction.slashTagsUrl ? (
						<ContactImage url={transaction.slashTagsUrl} />
					) : undefined
				}
			/>
			<View style={styles.content}>
				<NumberPadTextField
					value={text}
					testID="SendNumberField"
					onPress={onChangeUnit}
				/>

				<View style={styles.numberPad} testID="SendAmountNumberPad">
					<View style={styles.actions}>
						<View>
							<Caption13Up style={styles.availableAmountText} color="white50">
								{t(
									transaction.lightningInvoice
										? 'send_availabe_spending'
										: 'send_availabe_savings',
								)}
							</Caption13Up>
							<Money
								sats={availableAmount}
								size="bodySSB"
								testID="AvailableAmount"
								symbol={true}
								{...availableAmountProps}
							/>
						</View>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<TouchableOpacity
									style={styles.actionButton}
									color="white10"
									testID="SendNumberPadMax"
									onPress={onMaxAmount}>
									<Caption13Up color="brand">{t('send_max')}</Caption13Up>
								</TouchableOpacity>
							</View>

							<View style={styles.actionButtonContainer}>
								<UnitButton
									style={styles.actionButton}
									testID="SendNumberPadUnit"
									onPress={onChangeUnit}
								/>
							</View>
						</View>
					</View>

					<SendNumberPad
						value={text}
						maxAmount={availableAmount}
						onChange={setText}
						onError={onError}
					/>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={t('continue')}
						disabled={!isValid}
						testID="ContinueAmount"
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	numberPad: {
		flex: 1,
		marginTop: 'auto',
		maxHeight: 435,
	},
	actions: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginTop: 28,
		marginBottom: 5,
		paddingBottom: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
	},
	availableAmountText: {
		marginBottom: 5,
	},
	actionButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginLeft: 'auto',
	},
	actionButtonContainer: {
		alignItems: 'center',
	},
	actionButton: {
		marginLeft: 16,
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	buttonContainer: {
		justifyContent: 'flex-end',
	},
});

export default memo(Amount);
