import { useFocusEffect } from '@react-navigation/native';
import React, {
	ReactElement,
	memo,
	useMemo,
	useState,
	useCallback,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Money from '../../components/Money';
import NavigationHeader from '../../components/NavigationHeader';
import NumberPadTextField from '../../components/NumberPadTextField';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import { useAppSelector } from '../../hooks/redux';
import { useTransfer, useTransferFee } from '../../hooks/transfer';
import { useBalance, useSwitchUnit } from '../../hooks/wallet';
import type { TransferScreenProps } from '../../navigation/types';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import { onChainFeesSelector } from '../../store/reselect/fees';
import {
	conversionUnitSelector,
	denominationSelector,
	nextUnitSelector,
	unitSelector,
} from '../../store/reselect/settings';
import { transactionSelector } from '../../store/reselect/wallet';
import {
	refreshBlocktankInfo,
	startChannelPurchase,
} from '../../store/utils/blocktank';
import {
	View as ThemedView,
	TouchableHighlight,
} from '../../styles/components';
import { Caption13Up, Display } from '../../styles/text';
import { convertToSats } from '../../utils/conversion';
import { getDisplayValues } from '../../utils/displayValues';
import { showToast } from '../../utils/notifications';
import { getNumberPadText } from '../../utils/numberpad';
import UnitButton from '../Wallets/UnitButton';
import TransferNumberPad from './TransferNumberPad';

const SpendingAmount = ({
	navigation,
}: TransferScreenProps<'SpendingAmount'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const switchUnit = useSwitchUnit();
	const { onchainBalance } = useBalance();
	const transaction = useAppSelector(transactionSelector);
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const fees = useAppSelector(onChainFeesSelector);

	const [textFieldValue, setTextFieldValue] = useState('');
	const [loading, setLoading] = useState(false);

	const clientBalance = useMemo((): number => {
		return convertToSats(textFieldValue, conversionUnit);
	}, [textFieldValue, conversionUnit]);

	const transferValues = useTransfer(clientBalance);
	const { minLspBalance, defaultLspBalance, maxClientBalance } = transferValues;

	// Calculate the maximum amount that can be transferred
	const availableAmount = onchainBalance - transaction.fee;
	const { defaultLspBalance: maxLspBalance } = useTransfer(availableAmount);
	const { fee: maxLspFee } = useTransferFee(maxLspBalance, availableAmount);
	const feeMaximum = Math.floor(availableAmount - maxLspFee);
	const maximum = Math.min(maxClientBalance, feeMaximum);

	useFocusEffect(
		// biome-ignore lint/correctness/useExhaustiveDependencies: onMount
		useCallback(() => {
			const setupTransfer = async (): Promise<void> => {
				// In case of the low fee market, we bump fee by 5 sats
				// details: https://github.com/synonymdev/bitkit/issues/2139
				const getSatsPerByte = (fee: number): number => {
					const MIN_FEE = 10;
					const BUMP_FEE = 5;
					return fee <= MIN_FEE ? fee + BUMP_FEE : fee;
				};

				const satsPerByte = getSatsPerByte(fees.fast);

				await resetSendTransaction();
				await setupOnChainTransaction({ satsPerByte, rbf: false });
				refreshBlocktankInfo().then();
			};
			setupTransfer();
		}, []),
	);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(clientBalance, denomination, nextUnit);
		setTextFieldValue(result);
		switchUnit();
	};

	const onQuarter = (): void => {
		const quarter = Math.round(onchainBalance / 4);
		const amount = Math.min(quarter, maximum);
		const result = getNumberPadText(amount, denomination, unit);
		setTextFieldValue(result);
	};

	const onMaxAmount = (): void => {
		const result = getNumberPadText(maximum, denomination, unit);
		setTextFieldValue(result);
	};

	const onNumberPadError = (): void => {
		const dv = getDisplayValues({ satoshis: maximum });
		let description = t('spending_amount.error_max.description', {
			amount: dv.bitcoinFormatted,
		});

		if (maximum === 0) {
			description = t('spending_amount.error_max.description_zero');
		}

		showToast({
			type: 'warning',
			title: t('spending_amount.error_max.title'),
			description,
		});
	};

	const onContinue = async (): Promise<void> => {
		setLoading(true);

		const lspBalance = Math.max(defaultLspBalance, minLspBalance);
		const result = await startChannelPurchase({ clientBalance, lspBalance });

		setLoading(false);

		if (result.isErr()) {
			const { message } = result.error;
			const nodeCapped = message.includes('channel size check');
			const title = nodeCapped
				? t('spending_amount.error_max.title')
				: t('error_channel_purchase');
			const description = nodeCapped
				? 'Node capacity reached. Please try a smaller amount.'
				: t('error_channel_setup_msg', { raw: message });

			showToast({
				type: 'warning',
				title,
				description,
			});
			return;
		}

		navigation.navigate('SpendingConfirm', { order: result.value });
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('transfer.nav_title')} />

			<View style={styles.content} testID="SpendingAmount">
				<Display>
					<Trans
						t={t}
						i18nKey="spending_amount.title"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>

				<View style={styles.amountContainer}>
					<NumberPadTextField
						value={textFieldValue}
						showConversion={false}
						testID="SpendingAmountNumberField"
						onPress={onChangeUnit}
					/>
				</View>

				<View style={styles.numberPad} testID="SendAmountNumberPad">
					<View style={styles.actions}>
						<View>
							<Caption13Up style={styles.availableAmountText} color="secondary">
								{t('available')}
							</Caption13Up>
							<Money
								sats={availableAmount}
								size="bodySSB"
								testID="SpendingAmountAvailable"
								symbol={true}
							/>
						</View>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<UnitButton
									style={styles.actionButton}
									color="purple"
									testID="SpendingAmountUnit"
									onPress={onChangeUnit}
								/>
							</View>

							<View style={styles.actionButtonContainer}>
								<TouchableHighlight
									style={styles.actionButton}
									color="white10"
									testID="SpendingAmountQuarter"
									onPress={onQuarter}>
									<Caption13Up color="purple">
										{t('spending_amount.quarter')}
									</Caption13Up>
								</TouchableHighlight>
							</View>

							<View style={styles.actionButtonContainer}>
								<TouchableHighlight
									style={styles.actionButton}
									color="white10"
									testID="SpendingAmountMax"
									onPress={onMaxAmount}>
									<Caption13Up color="purple">{t('max')}</Caption13Up>
								</TouchableHighlight>
							</View>
						</View>
					</View>

					<TransferNumberPad
						style={styles.numberpad}
						value={textFieldValue}
						maxAmount={maximum}
						onChange={setTextFieldValue}
						onError={onNumberPadError}
					/>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('continue')}
						size="large"
						loading={loading}
						testID="SpendingAmountContinue"
						onPress={onContinue}
					/>
				</View>
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
	amountContainer: {
		marginTop: 'auto',
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
		marginBottom: 3,
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
	numberpad: {
		marginTop: 16,
		marginHorizontal: -16,
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(SpendingAmount);
