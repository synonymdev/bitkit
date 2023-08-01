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
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';

import { TouchableOpacity } from '../../../styles/components';
import { Caption13Up, Text02B } from '../../../styles/text';
import { SwitchIcon } from '../../../styles/icons';
import { IColors } from '../../../styles/colors';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Money from '../../../components/Money';
import ProfileImage from '../../../components/ProfileImage';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SendNumberPad from './SendNumberPad';
import Button from '../../../components/Button';
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
	primaryUnitSelector,
	coinSelectAutoSelector,
} from '../../../store/reselect/settings';
import { useProfile } from '../../../hooks/slashtags';
import { useSwitchUnit } from '../../../hooks/wallet';
import { useCurrency } from '../../../hooks/displayValues';
import { updateSendTransaction } from '../../../store/actions/wallet';
import { getNumberPadText } from '../../../utils/numberpad';
import { showToast } from '../../../utils/notifications';
import { convertToSats } from '../../../utils/conversion';
import { TRANSACTION_DEFAULTS } from '../../../utils/wallet/constants';
import type { SendScreenProps } from '../../../navigation/types';
import { EUnit } from '../../../store/types/wallet';

const ContactImage = ({ url }: { url: string }): ReactElement => {
	const { profile } = useProfile(url);
	return <ProfileImage url={url} image={profile.image} size={24} />;
};

const Amount = ({ navigation }: SendScreenProps<'Amount'>): ReactElement => {
	const route = useRoute();
	const { t } = useTranslation('wallet');
	const { fiatTicker } = useCurrency();
	const [nextUnit, switchUnit] = useSwitchUnit();
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const coinSelectAuto = useSelector(coinSelectAutoSelector);
	const transaction = useSelector(transactionSelector);
	const unit = useSelector(primaryUnitSelector);
	const isMaxSendAmount = useSelector(transactionMaxSelector);
	const [text, setText] = useState('');
	const [error, setError] = useState(false);

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
		...(error && { color: 'brand' as keyof IColors }),
	};

	// Unset isMaxSendAmount after edit
	useEffect(() => {
		if (isMaxSendAmount && amount !== availableAmount) {
			updateSendTransaction({ transaction: { max: false } });
		}

		if (!isMaxSendAmount && amount === availableAmount) {
			updateSendTransaction({ transaction: { max: true } });
		}
	}, [isMaxSendAmount, amount, availableAmount]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(amount, nextUnit);
		setText(result);
		switchUnit();
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
			transaction,
		});
		if (result.isErr()) {
			showToast({
				type: 'error',
				title: t('send_amount_error_title'),
				description: result.error.message,
			});
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
					onPress={onChangeUnit}
					value={text}
					testID="SendNumberField"
				/>

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
								sats={availableAmount}
								size="text02m"
								testID="AvailableAmount"
								symbol={true}
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
										{nextUnit === EUnit.BTC && 'BTC'}
										{nextUnit === EUnit.satoshi && 'sats'}
										{nextUnit === EUnit.fiat && fiatTicker}
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
