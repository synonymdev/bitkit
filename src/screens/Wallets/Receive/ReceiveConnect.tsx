import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up, Text01B, Text01S } from '../../../styles/text';
import GradientView from '../../../components/GradientView';
import AmountToggle from '../../../components/AmountToggle';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import GlowImage from '../../../components/GlowImage';
import Money from '../../../components/Money';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useScreenSize } from '../../../hooks/screen';
import { useCurrency, useDisplayValues } from '../../../hooks/displayValues';
import { useLightningBalance } from '../../../hooks/lightning';
import { receiveSelector } from '../../../store/reselect/receive';
import { DEFAULT_CHANNEL_DURATION } from '../../Lightning/CustomConfirm';
import { addCjitEntry } from '../../../store/slices/blocktank';
import { updateInvoice } from '../../../store/slices/receive';
import { createCJitEntry, estimateOrderFee } from '../../../utils/blocktank';
import { showToast } from '../../../utils/notifications';
import { blocktankInfoSelector } from '../../../store/reselect/blocktank';
import type { ReceiveScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/lightning.png');

const ReceiveConnect = ({
	navigation,
}: ReceiveScreenProps<'ReceiveConnect'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { isSmallScreen } = useScreenSize();
	const { fiatSymbol } = useCurrency();
	const lightningBalance = useLightningBalance(true);
	const [feeEstimate, setFeeEstimate] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const dispatch = useAppDispatch();
	const blocktank = useAppSelector(blocktankInfoSelector);
	const { amount, message } = useAppSelector(receiveSelector);

	const { maxChannelSizeSat } = blocktank.options;
	const payAmount = amount - feeEstimate;
	const displayFee = useDisplayValues(feeEstimate);

	useEffect(() => {
		const getFeeEstimation = async (): Promise<void> => {
			const estimate = await estimateOrderFee({
				lspBalanceSat: amount,
				channelExpiryWeeks: DEFAULT_CHANNEL_DURATION,
			});
			if (estimate.isOk()) {
				setFeeEstimate(estimate.value);
			}
		};

		getFeeEstimation();
	}, [amount]);

	const onContinue = async (): Promise<void> => {
		setIsLoading(true);
		const cJitEntryResponse = await createCJitEntry({
			channelSizeSat: maxChannelSizeSat,
			invoiceSat: amount,
			invoiceDescription: message,
			channelExpiryWeeks: DEFAULT_CHANNEL_DURATION,
			couponCode: 'bitkit',
		});
		if (cJitEntryResponse.isErr()) {
			showToast({
				type: 'error',
				title: t('receive_cjit_error'),
				description: cJitEntryResponse.error.message,
			});
			return;
		}
		const order = cJitEntryResponse.value;
		dispatch(updateInvoice({ jitOrder: order }));
		dispatch(addCjitEntry(order));
		setIsLoading(false);
		navigation.navigate('ReceiveQR');
	};

	const isInitial = lightningBalance.localBalance === 0;
	const imageSize = isSmallScreen ? 130 : 192;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('receive_instantly')} />
			<View style={styles.content}>
				<AmountToggle sats={amount} reverse={true} space={12} />

				<Text01S style={styles.text} color="gray1">
					<Trans
						t={t}
						i18nKey={
							isInitial
								? 'receive_connect_initial'
								: 'receive_connect_additional'
						}
						components={{ highlight: <Text01B color="white" /> }}
						values={{ lspFee: `${fiatSymbol}${displayFee.fiatFormatted}` }}
					/>
				</Text01S>

				<View style={styles.payAmount}>
					<Caption13Up style={styles.payAmountText} color="gray1">
						{t('receive_will')}
					</Caption13Up>
					<Money
						sats={payAmount}
						size="title"
						symbol={true}
						testID="AvailableAmount"
					/>
				</View>

				<GlowImage image={imageSrc} glowColor="purple" imageSize={imageSize} />

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={t('continue')}
						loading={isLoading}
						testID="ReceiveConnectContinue"
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
	text: {
		marginTop: 32,
	},
	payAmount: {
		marginTop: 32,
	},
	payAmountText: {
		marginBottom: 5,
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ReceiveConnect);
