import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import { Caption13Up } from '../../../styles/text';
import { TouchableOpacity } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Money from '../../../components/Money';
import Button from '../../../components/Button';
import GradientView from '../../../components/GradientView';
import ReceiveNumberPad from './ReceiveNumberPad';
import UnitButton from '../UnitButton';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { updateInvoice } from '../../../store/slices/receive';
import { receiveSelector } from '../../../store/reselect/receive';
import { estimateOrderFee } from '../../../utils/blocktank';
import { getNumberPadText } from '../../../utils/numberpad';
import { blocktankInfoSelector } from '../../../store/reselect/blocktank';
import { refreshBlocktankInfo } from '../../../store/utils/blocktank';
import {
	nextUnitSelector,
	denominationSelector,
	unitSelector,
} from '../../../store/reselect/settings';
import type { ReceiveScreenProps } from '../../../navigation/types';

const ReceiveAmount = ({
	navigation,
}: ReceiveScreenProps<'ReceiveAmount'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const dispatch = useAppDispatch();
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const invoice = useAppSelector(receiveSelector);
	const blocktank = useAppSelector(blocktankInfoSelector);
	const [minimumAmount, setMinimumAmount] = useState(0);

	const { maxChannelSizeSat } = blocktank.options;
	const channelSize = Math.round(maxChannelSizeSat / 2);

	useFocusEffect(
		useCallback(() => {
			refreshBlocktankInfo().then();
		}, []),
	);

	useEffect(() => {
		// The minimum amount is the fee for the channel plus a buffer
		const getFeeEstimation = async (): Promise<void> => {
			const feeResult = await estimateOrderFee({ lspBalance: channelSize });
			if (feeResult.isOk()) {
				// round up to the nearest 1000 to avoid fee fluctuations
				const minimum = Math.round(feeResult.value / 1000) * 1000;
				setMinimumAmount(minimum);
			}
		};

		getFeeEstimation();
	}, [channelSize]);

	const onMinimum = (): void => {
		const result = getNumberPadText(minimumAmount, denomination, unit);
		dispatch(updateInvoice({ amount: minimumAmount, numberPadText: result }));
	};

	const onChangeUnit = (): void => {
		const result = getNumberPadText(invoice.amount, denomination, nextUnit);
		dispatch(updateInvoice({ numberPadText: result }));
	};

	const onContinue = (): void => {
		navigation.navigate('ReceiveConnect');
	};

	const continueDisabled =
		invoice.amount < minimumAmount || invoice.amount > channelSize;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('receive_instantly')}
				displayBackButton={true}
			/>
			<View style={styles.content}>
				<NumberPadTextField
					value={invoice.numberPadText}
					testID="ReceiveNumberPadTextField"
				/>

				<View style={styles.numberPad} testID="ReceiveNumberPad">
					<View style={styles.actions}>
						<TouchableOpacity onPress={onMinimum}>
							<Caption13Up style={styles.minimumText} color="gray1">
								{t('minimum')}
							</Caption13Up>
							<Money
								sats={minimumAmount}
								size="text02m"
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
							testID="ReceiveAmountContinue"
							onPress={onContinue}
							disabled={continueDisabled}
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
