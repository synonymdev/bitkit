import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up, BodyMB, BodyM } from '../../../styles/text';
import GradientView from '../../../components/GradientView';
import AmountToggle from '../../../components/AmountToggle';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import Money from '../../../components/Money';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useCurrency, useDisplayValues } from '../../../hooks/displayValues';
import { useLightningBalance } from '../../../hooks/lightning';
import { receiveSelector } from '../../../store/reselect/receive';
import { addCjitEntry } from '../../../store/slices/blocktank';
import { updateInvoice } from '../../../store/slices/receive';
import { createCJitEntry, estimateOrderFee } from '../../../utils/blocktank';
import { showToast } from '../../../utils/notifications';
import { blocktankInfoSelector } from '../../../store/reselect/blocktank';
import type { ReceiveScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/lightning.png');

const ReceiveConnect = ({
	navigation,
	route,
}: ReceiveScreenProps<'ReceiveConnect'>): ReactElement => {
	const isAdditional = route.params?.isAdditional ?? false;
	const { t } = useTranslation('wallet');
	// const { isSmallScreen } = useScreenSize();
	const { fiatSymbol } = useCurrency();
	const lightningBalance = useLightningBalance(true);
	const [feeEstimate, setFeeEstimate] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const dispatch = useAppDispatch();
	const blocktank = useAppSelector(blocktankInfoSelector);
	const { amount, message } = useAppSelector(receiveSelector);

	const { maxChannelSizeSat } = blocktank.options;
	const minChannelSize = Math.round(amount * 2.5);
	const maxChannelSize = Math.round(maxChannelSizeSat / 2);
	const channelSize = Math.max(minChannelSize, maxChannelSize);
	const lspBalance = channelSize - amount;
	const payAmount = amount - feeEstimate;
	const displayFee = useDisplayValues(feeEstimate);

	useEffect(() => {
		const getFeeEstimation = async (): Promise<void> => {
			const estimate = await estimateOrderFee({ lspBalance });
			if (estimate.isOk()) {
				setFeeEstimate(estimate.value);
			}
		};

		getFeeEstimation();
	}, [lspBalance]);

	const onMore = (): void => {
		navigation.navigate('Liquidity', {
			channelSize,
			localBalance: payAmount,
			isAdditional,
		});
	};

	const onContinue = async (): Promise<void> => {
		setIsLoading(true);
		const cJitEntryResponse = await createCJitEntry({
			channelSize: channelSize,
			invoiceAmount: amount,
			invoiceDescription: message,
		});
		if (cJitEntryResponse.isErr()) {
			showToast({
				type: 'warning',
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
	// const imageSize = isSmallScreen ? 130 : 192;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('receive_bitcoin')} />
			<View style={styles.content}>
				<AmountToggle amount={amount} />

				<BodyM style={styles.text} color="secondary">
					<Trans
						t={t}
						i18nKey={
							isInitial
								? 'receive_connect_initial'
								: 'receive_connect_additional'
						}
						components={{ accent: <BodyMB color="white" /> }}
						values={{ lspFee: `${fiatSymbol}${displayFee.fiatFormatted}` }}
					/>
				</BodyM>

				<View style={styles.payAmount}>
					<Caption13Up style={styles.payAmountText} color="secondary">
						{t('receive_will')}
					</Caption13Up>
					<Money
						sats={payAmount}
						size="title"
						symbol={true}
						testID="AvailableAmount"
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
