import React, { ReactElement, memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import {
	View as ThemedView,
	TouchableHighlight,
} from '../../styles/components';
import { Display, Caption13Up } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import NumberPadTextField from '../../components/NumberPadTextField';
import Money from '../../components/Money';
import Button from '../../components/buttons/Button';
import TransferNumberPad from './TransferNumberPad';
import { useAppSelector } from '../../hooks/redux';
import { useSwitchUnit } from '../../hooks/wallet';
import { useTransfer } from '../../hooks/transfer';
import { convertToSats } from '../../utils/conversion';
import { showToast } from '../../utils/notifications';
import { estimateOrderFee } from '../../utils/blocktank';
import { getNumberPadText } from '../../utils/numberpad';
import type { TransferScreenProps } from '../../navigation/types';
import { startChannelPurchase } from '../../store/utils/blocktank';
import {
	nextUnitSelector,
	unitSelector,
	conversionUnitSelector,
	denominationSelector,
} from '../../store/reselect/settings';

const SpendingAdvanced = ({
	navigation,
	route,
}: TransferScreenProps<'SpendingAdvanced'>): ReactElement => {
	const { order } = route.params;
	const { t } = useTranslation('lightning');
	const switchUnit = useSwitchUnit();
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const transferValues = useTransfer(order.clientBalanceSat);
	const { defaultLspBalance, minLspBalance, maxLspBalance } = transferValues;

	const [textFieldValue, setTextFieldValue] = useState('');
	const [loading, setLoading] = useState(false);
	const [feeEstimate, setFeeEstimate] = useState<{ [key: string]: number }>({});

	const clientBalance = order.clientBalanceSat;

	const lspBalance = useMemo((): number => {
		return convertToSats(textFieldValue, conversionUnit);
	}, [textFieldValue, conversionUnit]);

	// fetch LSP fee estimate
	useEffect(() => {
		// if fee exists in cache, do not fetch again
		if (feeEstimate[`${clientBalance}-${lspBalance}`]) {
			return;
		}

		const getChannelOpenCost = async (): Promise<void> => {
			if (lspBalance < minLspBalance) {
				return;
			}

			const result = await estimateOrderFee({ lspBalance, clientBalance });
			if (result.isErr()) {
				return;
			}

			const fee = result.value.feeSat;

			setFeeEstimate((value) => ({
				...value,
				[`${clientBalance}-${lspBalance}`]: fee,
			}));
		};

		getChannelOpenCost();
		// only fetch when balance changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lspBalance, clientBalance, minLspBalance]);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(lspBalance, denomination, nextUnit);
		setTextFieldValue(result);
		switchUnit();
	};

	const onDefault = (): void => {
		const result = getNumberPadText(defaultLspBalance, denomination, unit);
		setTextFieldValue(result);
	};

	const onMinAmount = (): void => {
		const result = getNumberPadText(minLspBalance, denomination, unit);
		setTextFieldValue(result);
	};

	const onMaxAmount = (): void => {
		const result = getNumberPadText(maxLspBalance, denomination, unit);
		setTextFieldValue(result);
	};

	const onContinue = async (): Promise<void> => {
		setLoading(true);

		const response = await startChannelPurchase({ clientBalance, lspBalance });

		setLoading(false);

		if (response.isErr()) {
			const { message } = response.error;
			const description = t('error_channel_setup_msg', { raw: message });

			showToast({
				type: 'warning',
				title: t('error_channel_purchase'),
				description,
			});
			return;
		}

		navigation.popTo('SpendingConfirm', {
			order: response.value,
			advanced: true,
		});
	};

	const fee = feeEstimate[`${clientBalance}-${lspBalance}`];
	const isValid = lspBalance >= minLspBalance && lspBalance <= maxLspBalance;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('transfer.nav_title')} />

			<View style={styles.content} testID="SpendingAdvanced">
				<Display>
					<Trans
						t={t}
						i18nKey="spending_advanced.title"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>

				<View style={styles.amountContainer}>
					<NumberPadTextField
						value={textFieldValue}
						showConversion={false}
						testID="SpendingAdvancedNumberField"
						onPress={onChangeUnit}
					/>
				</View>

				<View style={styles.fee}>
					<Caption13Up style={styles.feeLabel} color="secondary">
						{t('spending_advanced.fee')}:
					</Caption13Up>

					{fee ? (
						<Money
							sats={feeEstimate[`${clientBalance}-${lspBalance}`]}
							size="bodySSB"
							symbol={true}
						/>
					) : (
						<Caption13Up color="secondary">—</Caption13Up>
					)}
				</View>

				<View style={styles.numberPad} testID="SendAmountNumberPad">
					<View style={styles.actions}>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<TouchableHighlight
									style={styles.actionButton}
									color="white10"
									testID="SpendingAdvancedMin"
									onPress={onMinAmount}>
									<Caption13Up color="purple">{t('min')}</Caption13Up>
								</TouchableHighlight>
							</View>

							<View style={styles.actionButtonContainer}>
								<TouchableHighlight
									style={styles.actionButton}
									color="white10"
									testID="SpendingAdvancedDefault"
									onPress={onDefault}>
									<Caption13Up color="purple">{t('default')}</Caption13Up>
								</TouchableHighlight>
							</View>

							<View style={styles.actionButtonContainer}>
								<TouchableHighlight
									style={styles.actionButton}
									color="white10"
									testID="SpendingAdvancedMax"
									onPress={onMaxAmount}>
									<Caption13Up color="purple">{t('max')}</Caption13Up>
								</TouchableHighlight>
							</View>
						</View>
					</View>

					<TransferNumberPad
						style={styles.numberpad}
						value={textFieldValue}
						maxAmount={maxLspBalance}
						onChange={setTextFieldValue}
					/>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('continue')}
						size="large"
						loading={loading}
						disabled={!isValid}
						testID="SpendingAdvancedContinue"
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
		marginTop: 32,
	},
	fee: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 9,
		minHeight: 20,
	},
	feeLabel: {
		marginRight: 8,
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
	actionButtons: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
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

export default memo(SpendingAdvanced);
