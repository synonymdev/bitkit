import React, {
	ReactElement,
	memo,
	useMemo,
	useState,
	useCallback,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Trans, useTranslation } from 'react-i18next';

import {
	View as ThemedView,
	TouchableHighlight,
} from '../../styles/components';
import { Display, Caption13Up } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import NumberPadTextField from '../../components/NumberPadTextField';
import Button from '../../components/buttons/Button';
import TransferNumberPad from './TransferNumberPad';
import type { TransferScreenProps } from '../../navigation/types';
import { useAppSelector } from '../../hooks/redux';
import { useBalance, useSwitchUnit } from '../../hooks/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import { convertToSats } from '../../utils/conversion';
import { showToast } from '../../utils/notifications';
import { getNumberPadText } from '../../utils/numberpad';
import {
	startChannelPurchase,
	refreshBlocktankInfo,
} from '../../store/utils/blocktank';
import {
	nextUnitSelector,
	unitSelector,
	conversionUnitSelector,
	denominationSelector,
} from '../../store/reselect/settings';
import UnitButton from '../Wallets/UnitButton';
import Money from '../../components/Money';
import { getMaxSendAmount } from '../../utils/wallet/transactions';
import { transactionSelector } from '../../store/reselect/wallet';
import { MAX_SPENDING_PERCENTAGE } from '../../utils/wallet/constants';
import { blocktankInfoSelector } from '../../store/reselect/blocktank';

const SpendingAmount = ({
	navigation,
}: TransferScreenProps<'SpendingAmount'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const switchUnit = useSwitchUnit();
	const { onchainBalance } = useBalance();
	const blocktankInfo = useAppSelector(blocktankInfoSelector);
	const transaction = useAppSelector(transactionSelector);
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);

	const [textFieldValue, setTextFieldValue] = useState('');
	const [loading, setLoading] = useState(false);

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

	// Calculate limits
	const minChannelSize = blocktankInfo.options.minChannelSizeSat;
	const maxChannelSize = blocktankInfo.options.maxChannelSizeSat;
	const max0ConfClientBalance = blocktankInfo.options.max0ConfClientBalanceSat;
	// 80% cap to leave buffer for fees
	const localLimit = Math.round(onchainBalance * MAX_SPENDING_PERCENTAGE);
	// LSP balance should be at least half of the max channel size
	// TODO: get exact requirements from LSP
	const lspLimit = maxChannelSize / 2;
	const maxClientBalance = Math.min(localLimit, lspLimit);

	const clientBalance = useMemo((): number => {
		return convertToSats(textFieldValue, conversionUnit);
	}, [textFieldValue, conversionUnit]);

	const availableAmount = useMemo(() => {
		const maxAmountResponse = getMaxSendAmount();
		if (maxAmountResponse.isOk()) {
			return maxAmountResponse.value.amount;
		}
		return 0;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, transaction.satsPerByte]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(clientBalance, denomination, nextUnit);
		setTextFieldValue(result);
		switchUnit();
	};

	const onQuarter = (): void => {
		const quarter = Math.round(onchainBalance / 4);
		const maxAmount = Math.min(localLimit, lspLimit);
		const amount = Math.min(quarter, maxAmount);
		const result = getNumberPadText(amount, denomination, unit);
		setTextFieldValue(result);
	};

	const onMaxAmount = (): void => {
		const maxAmount = Math.min(localLimit, lspLimit);
		const result = getNumberPadText(maxAmount, denomination, unit);
		setTextFieldValue(result);
	};

	const onNumberPadError = (): void => {
		showToast({
			type: 'warning',
			title: t('spending_amount.error_max.title'),
			description: t('spending_amount.error_max.description', {
				amount: maxClientBalance,
			}),
		});
	};

	const onContinue = async (): Promise<void> => {
		setLoading(true);

		// Aim for a balanced channel
		let lspBalance = clientBalance;
		// If the resulting channel is not large enough, add more to the LSP side
		if (clientBalance + lspBalance < minChannelSize) {
			lspBalance = minChannelSize - clientBalance;
		}

		const response = await startChannelPurchase({
			clientBalance,
			lspBalance,
			zeroConfPayment: clientBalance <= max0ConfClientBalance,
		});

		setLoading(false);

		if (response.isErr()) {
			const { message } = response.error;
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

		navigation.navigate('SpendingConfirm', { order: response.value });
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>

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
						maxAmount={maxClientBalance}
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
						disabled={!clientBalance}
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
