import { useFocusEffect } from '@react-navigation/native';
import React, { memo, ReactElement, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import AmountToggle from '../../../components/AmountToggle';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import HourglassSpinner from '../../../components/HourglassSpinner';
import LightningSyncing from '../../../components/LightningSyncing';
import SafeAreaInset from '../../../components/SafeAreaInset';
import SyncSpinner from '../../../components/SyncSpinner';
import { useBottomSheetScreenBackPress } from '../../../hooks/bottomSheet';
import { useAppDispatch } from '../../../hooks/redux';
import type { SendScreenProps } from '../../../navigation/types';
import { addPendingPayment } from '../../../store/slices/lightning';
import { EActivityType } from '../../../store/types/activity';
import { Display } from '../../../styles/text';
import {
	decodeLightningInvoice,
	payLightningInvoice,
} from '../../../utils/lightning';

const imageSrc = require('../../../assets/illustrations/coin-stack-4.png');

const Quickpay = ({
	navigation,
	route,
}: SendScreenProps<'Quickpay'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { invoice, amount } = route.params;
	const dispatch = useAppDispatch();

	useBottomSheetScreenBackPress();

	useFocusEffect(
		useCallback(() => {
			const pay = async (): Promise<void> => {
				const decodeResult = await decodeLightningInvoice(invoice);
				if (decodeResult.isErr()) {
					navigation.navigate('Error', {
						errorMessage: t('send_error_create_tx'),
					});
					return;
				}

				const { payment_hash } = decodeResult.value;
				const payResult = await payLightningInvoice({ invoice });

				if (payResult.isErr()) {
					const errorMessage = payResult.error.message;
					if (errorMessage === 'Timed Out.') {
						dispatch(addPendingPayment({ payment_hash, amount }));
						navigation.navigate('Pending', { txId: payment_hash });
						return;
					}

					console.error(errorMessage);
					navigation.navigate('Error', {
						errorMessage: t('send_error_create_tx'),
					});
					return;
				}

				navigation.navigate('Success', {
					type: EActivityType.lightning,
					txId: payment_hash,
					amount,
				});
			};

			pay();
		}, [invoice, amount, dispatch, navigation, t]),
	);

	return (
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader
				title={t('send_quickpay.nav_title')}
				showBackButton={false}
			/>

			<View style={styles.content}>
				<AmountToggle amount={amount} testID="SendQuickpayAmount" />

				<View style={styles.imageContainer}>
					<SyncSpinner />
					<HourglassSpinner image={imageSrc} imageSize={311} />
				</View>

				<Display>
					<Trans
						t={t}
						i18nKey="send_quickpay.title"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />

			<LightningSyncing
				style={styles.syncing}
				title={t('send_quickpay.nav_title')}
			/>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 311,
		aspectRatio: 1,
		marginTop: 'auto',
		marginBottom: 'auto',
	},
	syncing: {
		...StyleSheet.absoluteFillObject,
	},
});

export default memo(Quickpay);
