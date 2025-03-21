import { useFocusEffect, useRoute } from '@react-navigation/native';
import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
	useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import ContactImage from '../../../components/ContactImage';
import GradientView from '../../../components/GradientView';
import Money from '../../../components/Money';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useAppSelector } from '../../../hooks/redux';
import { useBalance, useSwitchUnit } from '../../../hooks/wallet';
import type { SendScreenProps } from '../../../navigation/types';
import {
	setupFeeForOnChainTransaction,
	setupOnChainTransaction,
	updateBeignetSendTransaction,
} from '../../../store/actions/wallet';
import {
	coinSelectAutoSelector,
	conversionUnitSelector,
	denominationSelector,
	nextUnitSelector,
	unitSelector,
} from '../../../store/reselect/settings';
import { sendTransactionSelector } from '../../../store/reselect/ui';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionMaxSelector,
	transactionSelector,
	utxosSelector,
} from '../../../store/reselect/wallet';
import { IColors } from '../../../styles/colors';
import { Caption13Up } from '../../../styles/text';
import { convertToSats } from '../../../utils/conversion';
import { showToast } from '../../../utils/notifications';
import { getNumberPadText } from '../../../utils/numberpad';
import { TRANSACTION_DEFAULTS } from '../../../utils/wallet/constants';
import {
	getMaxSendAmount,
	getTransactionOutputValue,
	sendMax,
	updateSendAmount,
} from '../../../utils/wallet/transactions';
import AssetButton from '../AssetButton';
import UnitButton from '../UnitButton';
import SendNumberPad from './SendNumberPad';

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

	const { paymentMethod } = useAppSelector(sendTransactionSelector);
	const usesLightning = paymentMethod === 'lightning';

	const outputAmount = useMemo(() => {
		const amount = getTransactionOutputValue({ outputs: transaction.outputs });
		return amount;
	}, [transaction.outputs]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: recalculate max when utxos, fee or payment method change
	const availableAmount = useMemo(() => {
		const maxAmountResponse = getMaxSendAmount({ method: paymentMethod });
		if (maxAmountResponse.isOk()) {
			return maxAmountResponse.value.amount;
		}
		return 0;
	}, [transaction.outputs, transaction.satsPerByte, paymentMethod]);

	useFocusEffect(
		// biome-ignore lint/correctness/useExhaustiveDependencies: ignore transaction.outputs here because it causes infinite loop
		useCallback(() => {
			// This is triggered when the user removes all inputs from the coin selection screen.
			if (
				!usesLightning &&
				onchainBalance > TRANSACTION_DEFAULTS.dustLimit &&
				(availableAmount === 0 || !transaction.inputs.length)
			) {
				const output = { ...transaction.outputs[0], amount: 0 };
				setupOnChainTransaction({
					utxos,
					satsPerByte: transaction.satsPerByte,
					outputs: [output],
				});
				const result = getNumberPadText(0, denomination, unit);
				setText(result);
			}
		}, [
			availableAmount,
			onchainBalance,
			usesLightning,
			transaction.inputs.length,
			transaction.satsPerByte,
			denomination,
			unit,
			utxos,
		]),
	);

	// Set initial text for NumberPadTextField
	// biome-ignore lint/correctness/useExhaustiveDependencies: only update if the outputAmount/wallet/network changes
	useEffect(() => {
		const result = getNumberPadText(outputAmount, denomination, unit);
		setText(result);
	}, [outputAmount, selectedWallet, selectedNetwork]);

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
			updateBeignetSendTransaction({ max: false });
		}

		if (!isMaxSendAmount && amount === availableAmount) {
			updateBeignetSendTransaction({ max: true });
		}
	}, [isMaxSendAmount, amount, availableAmount, transaction?.lightningInvoice]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(amount, denomination, nextUnit);
		setText(result);
		switchUnit();
	};

	const onMaxAmount = useCallback((): void => {
		const result = getNumberPadText(availableAmount, denomination, unit);
		setText(result);

		if (usesLightning) {
			showToast({
				type: 'warning',
				title: t('send_max_spending.title'),
				description: t('send_max_spending.description'),
			});
		}

		sendMax();
	}, [availableAmount, usesLightning, denomination, unit, t]);

	const onError = (): void => {
		setError(true);
		setTimeout(() => setError(false), 500);
	};

	const onContinue = useCallback((): void => {
		const result = updateSendAmount({
			amount,
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

		// If coin selection is enabled and the user wants to pay onchain.
		if (!coinSelectAuto && !usesLightning) {
			navigation.navigate('CoinSelection');
		} else {
			if (!usesLightning) {
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
	}, [amount, coinSelectAuto, transaction, usesLightning, navigation, t]);

	const isValid = useMemo(() => {
		if (amount === 0) {
			return false;
		}

		// onchain tx
		if (!usesLightning) {
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
	}, [amount, usesLightning, availableAmount]);

	const canGoBack = navigation.getState().routes[0]?.key !== route.key;
	const hasOutput = !!transaction.outputs[0]?.address;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('send_amount')}
				showBackButton={canGoBack}
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
						<TouchableOpacity onPress={onMaxAmount}>
							<Caption13Up style={styles.availableAmountText} color="secondary">
								{t('send_available')}
							</Caption13Up>
							<Money
								sats={availableAmount}
								size="bodySSB"
								symbol={true}
								testID="AvailableAmount"
								{...availableAmountProps}
							/>
						</TouchableOpacity>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<AssetButton
									style={styles.actionButton}
									savings={hasOutput}
									spending={!!transaction.lightningInvoice}
								/>
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
		gap: 8,
		marginLeft: 'auto',
	},
	actionButtonContainer: {
		alignItems: 'center',
	},
	actionButton: {
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
