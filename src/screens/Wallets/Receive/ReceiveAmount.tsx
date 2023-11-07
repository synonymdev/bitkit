import React, { ReactElement, memo, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import { TouchableOpacity } from '../../../styles/components';
import { Caption13Up, Text02B } from '../../../styles/text';
import { SwitchIcon } from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Money from '../../../components/Money';
import Button from '../../../components/Button';
import GradientView from '../../../components/GradientView';
import ReceiveNumberPad from './ReceiveNumberPad';
import { useSwitchUnit } from '../../../hooks/wallet';
import { useCurrency } from '../../../hooks/displayValues';
import { updateInvoice } from '../../../store/actions/receive';
import { receiveSelector } from '../../../store/reselect/receive';
import { getNumberPadText } from '../../../utils/numberpad';
import { createCJitEntry } from '../../../utils/blocktank';
import { showToast } from '../../../utils/notifications';
import { DEFAULT_CHANNEL_DURATION } from '../../Lightning/CustomConfirm';
import { blocktankInfoSelector } from '../../../store/reselect/blocktank';
import { refreshBlocktankInfo } from '../../../store/actions/blocktank';
import type { ReceiveScreenProps } from '../../../navigation/types';

// hardcoded to be above fee (1092)
// TODO: fee is dynamic so this should be fetched from the API
const MINIMUM_AMOUNT = 5000;

const ReceiveAmount = ({
	navigation,
}: ReceiveScreenProps<'ReceiveAmount'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { fiatTicker } = useCurrency();
	const [nextUnit, switchUnit] = useSwitchUnit();
	const [isLoading, setIsLoading] = useState(false);
	const invoice = useSelector(receiveSelector);
	const blocktank = useSelector(blocktankInfoSelector);

	const { maxChannelSizeSat } = blocktank.options;
	// channel size must be at least 2x the invoice amount
	const maxAmount = maxChannelSizeSat / 2;

	useFocusEffect(
		useCallback(() => {
			refreshBlocktankInfo().then();
		}, []),
	);

	const onChangeUnit = (): void => {
		const result = getNumberPadText(invoice.amount, nextUnit);
		updateInvoice({ numberPadText: result });
		switchUnit();
	};

	const onContinue = async (): Promise<void> => {
		setIsLoading(true);

		const cJitEntryResponse = await createCJitEntry({
			channelSizeSat: maxChannelSizeSat,
			invoiceSat: invoice.amount,
			invoiceDescription: invoice.message,
			channelExpiryWeeks: DEFAULT_CHANNEL_DURATION,
			couponCode: 'bitkit',
		});
		if (cJitEntryResponse.isErr()) {
			setIsLoading(false);
			console.log({ error: cJitEntryResponse.error.message });
			showToast({
				type: 'error',
				title: t('receive_cjit_error'),
				description: cJitEntryResponse.error.message,
			});
			return;
		}
		const order = cJitEntryResponse.value;
		updateInvoice({ jitOrder: order });
		navigation.navigate('ReceiveConnect');
		setIsLoading(false);
	};

	const continueDisabled =
		invoice.amount < MINIMUM_AMOUNT || invoice.amount > maxAmount;

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
						<View>
							<Caption13Up style={styles.minimumText} color="gray1">
								{t('minimum')}
							</Caption13Up>
							<Money sats={MINIMUM_AMOUNT} size="text02m" symbol={true} />
						</View>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<TouchableOpacity
									style={styles.actionButton}
									color="white08"
									testID="ReceiveNumberPadUnit"
									onPress={onChangeUnit}>
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

					<ReceiveNumberPad />

					<View style={styles.buttonContainer}>
						<Button
							size="large"
							text={t('continue')}
							loading={isLoading}
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
		marginTop: 'auto',
	},
});

export default memo(ReceiveAmount);
