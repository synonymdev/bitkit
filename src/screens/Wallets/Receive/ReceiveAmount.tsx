import { useFocusEffect } from '@react-navigation/native';
import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Money from '../../../components/Money';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useTransfer } from '../../../hooks/transfer';
import { useSwitchUnit } from '../../../hooks/wallet';
import type { ReceiveScreenProps } from '../../../navigation/types';
import { receiveSelector } from '../../../store/reselect/receive';
import {
	denominationSelector,
	nextUnitSelector,
	unitSelector,
} from '../../../store/reselect/settings';
import { updateInvoice } from '../../../store/slices/receive';
import { refreshBlocktankInfo } from '../../../store/utils/blocktank';
import { Caption13Up } from '../../../styles/text';
import { estimateOrderFee } from '../../../utils/blocktank';
import { showToast } from '../../../utils/notifications';
import { getNumberPadText } from '../../../utils/numberpad';
import UnitButton from '../UnitButton';
import ReceiveNumberPad from './ReceiveNumberPad';

const ReceiveAmount = ({
	navigation,
}: ReceiveScreenProps<'ReceiveAmount'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const dispatch = useAppDispatch();
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const invoice = useAppSelector(receiveSelector);
	const switchUnit = useSwitchUnit();
	const [minimumAmount, setMinimumAmount] = useState(0);

	const { defaultLspBalance: lspBalance, maxClientBalance } = useTransfer(0);

	useFocusEffect(
		useCallback(() => {
			refreshBlocktankInfo().then();
		}, []),
	);

	useEffect(() => {
		// The minimum amount is the fee for the channel plus a buffer
		const getFeeEstimation = async (): Promise<void> => {
			const feeResult = await estimateOrderFee({ lspBalance });
			if (feeResult.isOk()) {
				const fees = feeResult.value;
				// add 10% buffer and round up to the nearest 1000 to avoid fee fluctuations
				const minimum = Math.ceil((fees.feeSat * 1.1) / 1000) * 1000;
				setMinimumAmount(minimum);
			} else {
				showToast({
					type: 'error',
					title: t('receive_cjit_error'),
					description: feeResult.error.message,
				});
			}
		};

		getFeeEstimation();
	}, [lspBalance, t]);

	const onMinimum = (): void => {
		const result = getNumberPadText(minimumAmount, denomination, unit);
		dispatch(updateInvoice({ amount: minimumAmount, numberPadText: result }));
	};

	const onChangeUnit = (): void => {
		const result = getNumberPadText(invoice.amount, denomination, nextUnit);
		dispatch(updateInvoice({ numberPadText: result }));
		switchUnit();
	};

	const onContinue = (): void => {
		navigation.navigate('ReceiveConnect');
	};

	const onNumberPadPress = (): void => {
		onChangeUnit();
	};

	const continueDisabled =
		minimumAmount === 0 ||
		invoice.amount < minimumAmount ||
		invoice.amount > maxClientBalance;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('receive_bitcoin')} />
			<View style={styles.content}>
				<NumberPadTextField
					value={invoice.numberPadText}
					testID="ReceiveNumberPadTextField"
					onPress={onNumberPadPress}
				/>

				<View style={styles.numberPad} testID="ReceiveNumberPad">
					<View style={styles.actions}>
						<TouchableOpacity activeOpacity={0.7} onPress={onMinimum}>
							<Caption13Up style={styles.minimumText} color="secondary">
								{t('minimum')}
							</Caption13Up>
							<Money
								testID="ReceiveAmountMinimum"
								sats={minimumAmount}
								size="bodySSB"
								symbol={true}
								shouldRoundUp={true}
							/>
						</TouchableOpacity>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<UnitButton
									testID="ReceiveNumberPadUnit"
									onPress={onChangeUnit}
								/>
							</View>
						</View>
					</View>

					<ReceiveNumberPad />

					<View style={styles.buttonContainer}>
						<Button
							size="large"
							text={t('continue')}
							disabled={continueDisabled}
							testID="ReceiveAmountContinue"
							onPress={onContinue}
						/>
					</View>
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
	actions: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginBottom: 5,
		paddingBottom: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
	},
	numberPad: {
		flex: 1,
		marginTop: 'auto',
		maxHeight: 450,
	},
	minimumText: {
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
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ReceiveAmount);
