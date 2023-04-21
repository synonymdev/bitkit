import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
	useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { TouchableOpacity } from '../../../styles/components';
import { Caption13Up, Text02B } from '../../../styles/text';
import { SwitchIcon } from '../../../styles/icons';
import { IColors } from '../../../styles/colors';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Money from '../../../components/Money';
import ProfileImage from '../../../components/ProfileImage';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SendNumberPad from './SendNumberPad';
import Button from '../../../components/Button';
import { EBalanceUnit, EBitcoinUnit } from '../../../store/types/wallet';
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
} from '../../../store/reselect/wallet';
import {
	balanceUnitSelector,
	coinSelectAutoSelector,
} from '../../../store/reselect/settings';
import { useProfile } from '../../../hooks/slashtags';
import { useCurrency } from '../../../hooks/displayValues';
import { updateSettings } from '../../../store/actions/settings';
import { updateBitcoinTransaction } from '../../../store/actions/wallet';
import { getNumberPadText } from '../../../utils/numberpad';
import { convertToSats } from '../../../utils/exchange-rate';
import { TRANSACTION_DEFAULTS } from '../../../utils/wallet/constants';
import type { SendScreenProps } from '../../../navigation/types';

const ContactImage = ({ url }: { url: string }): JSX.Element => {
	const { profile } = useProfile(url);
	return <ProfileImage url={url} image={profile.image} size={24} />;
};

const Amount = ({ navigation }: SendScreenProps<'Amount'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const insets = useSafeAreaInsets();
	const { fiatTicker } = useCurrency();
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const coinSelectAuto = useSelector(coinSelectAutoSelector);
	const transaction = useSelector(transactionSelector);
	const unit = useSelector(balanceUnitSelector);
	const isMaxSendAmount = useSelector(transactionMaxSelector);
	const [text, setText] = useState('');
	const [error, setError] = useState(false);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	// Set initial text for NumberPadTextField
	useEffect(() => {
		const transactionOutputValue = getTransactionOutputValue({
			selectedWallet,
			selectedNetwork,
		});

		const result = getNumberPadText(transactionOutputValue, unit);
		setText(result);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, selectedWallet, selectedNetwork]);

	const amount = useMemo((): number => {
		return convertToSats(text, unit);
	}, [text, unit]);

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

	const availableAmountProps = {
		...(unit !== EBalanceUnit.fiat ? { symbol: true } : { showFiat: true }),
		...(error && { color: 'brand' as keyof IColors }),
	};

	// Unset isMaxSendAmount after edit
	useEffect(() => {
		if (isMaxSendAmount && amount !== availableAmount) {
			updateBitcoinTransaction({ transaction: { max: false } });
		}

		if (!isMaxSendAmount && amount === availableAmount) {
			updateBitcoinTransaction({ transaction: { max: true } });
		}
	}, [isMaxSendAmount, amount, availableAmount]);

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
		setText(result);

		updateSettings({
			balanceUnit: nextUnit,
			...(nextUnit !== EBalanceUnit.fiat && {
				bitcoinUnit: nextUnit as unknown as EBitcoinUnit,
			}),
		});
	};

	const onMaxAmount = useCallback((): void => {
		const result = getNumberPadText(availableAmount, unit);
		setText(result);
		sendMax({ selectedWallet, selectedNetwork });
	}, [availableAmount, unit, selectedWallet, selectedNetwork]);

	const onError = (): void => {
		setError(true);
		setTimeout(() => setError(false), 500);
	};

	const onContinue = useCallback((): void => {
		const result = updateSendAmount({
			amount,
			selectedWallet,
			selectedNetwork,
		});
		if (result.isErr()) {
			return;
		}

		// If auto coin-select is disabled and there is no lightning invoice.
		if (!coinSelectAuto && !transaction.lightningInvoice) {
			navigation.navigate('CoinSelection');
		} else {
			navigation.navigate('ReviewAndSend');
		}
	}, [
		amount,
		selectedWallet,
		selectedNetwork,
		coinSelectAuto,
		transaction.lightningInvoice,
		navigation,
	]);

	const isValid = useMemo(() => {
		if (amount === 0) {
			return false;
		}

		// onchain tx
		if (!transaction.lightningInvoice) {
			// amount is below dust limit
			if (amount <= TRANSACTION_DEFAULTS.recommendedBaseFee) {
				return false;
			}

			// amount is above availableAmount
			if (amount > availableAmount) {
				return false;
			}
		}

		return true;
	}, [amount, transaction.lightningInvoice, availableAmount]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('send_amount')}
				actionIcon={
					transaction.slashTagsUrl ? (
						<ContactImage url={transaction.slashTagsUrl} />
					) : undefined
				}
			/>
			<View style={styles.content}>
				<NumberPadTextField value={text} testID="SendNumberField" />

				<View style={styles.numberPad} testID="SendAmountNumberPad">
					<View style={styles.actions}>
						<View>
							<Caption13Up style={styles.availableAmountText} color="gray1">
								{t(
									transaction.lightningInvoice
										? 'send_availabe_spending'
										: 'send_availabe_savings',
								)}
							</Caption13Up>
							<Money
								key="small"
								sats={availableAmount}
								size="caption13M"
								decimalLength="long"
								testID="AvailableAmount"
								{...availableAmountProps}
							/>
						</View>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<TouchableOpacity
									style={styles.actionButton}
									color="white08"
									testID="SendNumberPadMax"
									onPress={onMaxAmount}>
									<Text02B
										size="12px"
										color={isMaxSendAmount ? 'orange' : 'brand'}>
										{t('send_max')}
									</Text02B>
								</TouchableOpacity>
							</View>

							<View style={styles.actionButtonContainer}>
								<TouchableOpacity
									style={styles.actionButton}
									color="white08"
									onPress={onChangeUnit}
									testID="SendNumberPadUnit">
									<SwitchIcon color="brand" width={16.44} height={13.22} />
									<Text02B
										style={styles.actionButtonText}
										size="12px"
										color="brand">
										{nextUnit === 'BTC' && 'BTC'}
										{nextUnit === 'satoshi' && 'sats'}
										{nextUnit === 'fiat' && fiatTicker}
									</Text02B>
								</TouchableOpacity>
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

				<View style={buttonContainerStyles}>
					<Button
						size="large"
						text={t('continue')}
						disabled={!isValid}
						testID="ContinueAmount"
						onPress={onContinue}
					/>
				</View>
			</View>
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
		maxHeight: 450,
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
		paddingVertical: 7,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionButtonText: {
		marginLeft: 11,
	},
	buttonContainer: {
		justifyContent: 'flex-end',
	},
});

export default memo(Amount);
