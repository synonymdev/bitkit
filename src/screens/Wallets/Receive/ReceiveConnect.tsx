import { useNavigation } from '@react-navigation/native';
import { IBtEstimateFeeResponse2 } from '@synonymdev/blocktank-lsp-http-client/dist/shared/IBtEstimateFeeResponse2';
import React, { memo, ReactElement, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import { ActivityIndicator } from '../../../components/ActivityIndicator';
import AmountToggle from '../../../components/AmountToggle';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Money from '../../../components/Money';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useCurrency, useDisplayValues } from '../../../hooks/displayValues';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useTransfer } from '../../../hooks/transfer';
import type { ReceiveScreenProps } from '../../../navigation/types';
import { ReceiveNavigationProp } from '../../../sheets/ReceiveNavigation';
import { receiveSelector } from '../../../store/reselect/receive';
import { addCjitEntry } from '../../../store/slices/blocktank';
import { updateInvoice } from '../../../store/slices/receive';
import { BodyM, BodyMB, Caption13Up } from '../../../styles/text';
import { createCJitEntry, estimateOrderFee } from '../../../utils/blocktank';
import { showToast } from '../../../utils/notifications';

const imageSrc = require('../../../assets/illustrations/lightning.png');

const FeeInfo = ({
	fees,
	isAdditional,
}: {
	fees: IBtEstimateFeeResponse2;
	isAdditional: boolean;
}): ReactElement => {
	const navigation = useNavigation<ReceiveNavigationProp>();
	const { t } = useTranslation('wallet');
	const { fiatSymbol } = useCurrency();
	const [isLoading, setIsLoading] = useState(false);
	const dispatch = useAppDispatch();
	const { amount, message } = useAppSelector(receiveSelector);

	const receiveAmount = amount - fees.feeSat;
	const { defaultLspBalance: lspBalance } = useTransfer(receiveAmount);
	const channelSize = receiveAmount + lspBalance;
	const networkFee = useDisplayValues(fees.networkFeeSat);
	const serviceFee = useDisplayValues(fees.serviceFeeSat);

	const onMore = (): void => {
		navigation.navigate('Liquidity', {
			channelSize,
			localBalance: receiveAmount,
			isAdditional,
		});
	};

	const onContinue = async (): Promise<void> => {
		setIsLoading(true);
		const result = await createCJitEntry({
			channelSize,
			invoiceAmount: amount,
			invoiceDescription: message,
		});
		if (result.isErr()) {
			showToast({
				type: 'warning',
				title: t('receive_cjit_error'),
				description: result.error.message,
			});
			setIsLoading(false);
			return;
		}
		const jitOrder = result.value;
		dispatch(updateInvoice({ jitOrder }));
		dispatch(addCjitEntry(jitOrder));
		setIsLoading(false);
		navigation.navigate('ReceiveQR');
	};

	return (
		<>
			<BodyM
				testID="ReceiveConnectLspFeeText"
				style={styles.text}
				color="secondary">
				<Trans
					t={t}
					i18nKey={
						isAdditional
							? 'receive_connect_additional'
							: 'receive_connect_initial'
					}
					components={{ accent: <BodyMB color="white" /> }}
					values={{
						networkFee: `${fiatSymbol}${networkFee.fiatFormatted}`,
						serviceFee: `${fiatSymbol}${serviceFee.fiatFormatted}`,
					}}
				/>
			</BodyM>

			<View style={styles.payAmount}>
				<Caption13Up style={styles.payAmountText} color="secondary">
					{t('receive_will')}
				</Caption13Up>
				<Money
					sats={receiveAmount}
					size="title"
					symbol={true}
					testID="ReceiveAmount"
				/>
			</View>

			<View style={styles.imageContainer}>
				<Image style={styles.image} source={imageSrc} />
			</View>

			<View style={styles.buttonContainer}>
				<Button
					style={styles.button}
					size="large"
					text={t('learn_more')}
					variant="secondary"
					testID="ReceiveConnectMore"
					onPress={onMore}
				/>
				<Button
					style={styles.button}
					size="large"
					text={t('continue')}
					loading={isLoading}
					testID="ReceiveConnectContinue"
					onPress={onContinue}
				/>
			</View>
		</>
	);
};

const ReceiveConnect = ({
	route,
}: ReceiveScreenProps<'ReceiveConnect'>): ReactElement => {
	const isAdditional = route.params?.isAdditional ?? false;
	const { t } = useTranslation('wallet');
	const [feeEstimate, setFeeEstimate] = useState<IBtEstimateFeeResponse2>();
	const [isLoading, setIsLoading] = useState(false);
	const { amount } = useAppSelector(receiveSelector);

	const fee = feeEstimate?.feeSat ?? 0;
	const receiveAmount = amount - fee;
	const { defaultLspBalance: lspBalance } = useTransfer(receiveAmount);

	useEffect(() => {
		const getFeeEstimation = async (): Promise<void> => {
			setIsLoading(true);
			const feeResult = await estimateOrderFee({
				lspBalance,
				clientBalance: amount,
			});
			if (feeResult.isOk()) {
				const fees = feeResult.value;
				setFeeEstimate(fees);
			} else {
				showToast({
					type: 'error',
					title: t('receive_cjit_error'),
					description: feeResult.error.message,
				});
			}
			setIsLoading(false);
		};

		getFeeEstimation();
	}, [t, lspBalance, amount]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('receive_bitcoin')} />
			<View style={styles.content}>
				<AmountToggle testID="ReceiveConnectAmount" amount={amount} />

				{!isLoading && feeEstimate ? (
					<FeeInfo fees={feeEstimate} isAdditional={isAdditional} />
				) : (
					<View style={styles.loading}>
						<ActivityIndicator />
					</View>
				)}
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
		marginTop: 24,
	},
	payAmount: {
		marginTop: 32,
	},
	payAmountText: {
		marginBottom: 5,
	},
	imageContainer: {
		flexShrink: 1,
		alignSelf: 'center',
		alignItems: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	loading: {
		marginTop: 'auto',
		marginBottom: 'auto',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(ReceiveConnect);
