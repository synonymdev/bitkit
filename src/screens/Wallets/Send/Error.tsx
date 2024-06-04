import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BodyM } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { processInputData } from '../../../utils/scanner';
import { showToast } from '../../../utils/notifications';
import type { SendScreenProps } from '../../../navigation/types';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../../store/actions/wallet';
import { closeSheet } from '../../../store/slices/ui';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';

const Error = ({
	navigation,
	route,
}: SendScreenProps<'Error'>): ReactElement => {
	const { t } = useTranslation('wallet');
	let { errorMessage } = route.params;
	const dispatch = useAppDispatch();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const transaction = useAppSelector(transactionSelector);
	const [loading, setLoading] = useState(false);

	const isSlashpay = transaction.lightningInvoice && transaction.slashTagsUrl;

	let navTitle = t('send_error_tx_failed');
	let imageSrc = require('../../../assets/illustrations/cross.png');
	let retryText: string | ReactElement = t('try_again');

	if (transaction.lightningInvoice && transaction.slashTagsUrl) {
		imageSrc = require('../../../assets/illustrations/exclamation-mark.png');
		navTitle = t('send_instant_failed');
		errorMessage = t('send_error_slash_ln');
		retryText = loading ? (
			<>
				<ActivityIndicator />
				{t('send_regular')}
			</>
		) : (
			t('send_regular')
		);
	}

	const handleClose = (): void => {
		dispatch(closeSheet('sendNavigation'));
	};

	const handleRetry = async (): Promise<void> => {
		if (transaction.lightningInvoice && transaction.slashTagsUrl) {
			setLoading(true);
			await resetSendTransaction();
			await setupOnChainTransaction({});
			const res = await processInputData({
				data: transaction.slashTagsUrl,
				source: 'send',
				selectedNetwork,
				selectedWallet,
				skip: ['lightningPaymentRequest'],
			});
			setLoading(false);
			if (res.isOk()) {
				navigation.navigate('Amount');
				return;
			}
			showToast({
				type: 'warning',
				title: t('send_error_contact'),
				description: t('other:try_again'),
			});

			return;
		}

		/*
			TODO: Add ability to distinguish between errors sent to this component.
			If unable to connect to or broadcast through Electrum, attempt to broadcast using the Blocktank api.
			If unable to properly create a valid transaction for any reason, reset the tx state as done below.
		*/
		//If unable to broadcast for any reason, reset the transaction object and try again.
		await resetSendTransaction();
		await setupOnChainTransaction();
		// The transaction was reset due to an unknown broadcast or construction error.
		// Navigate back to the main send screen to re-enter information.
		navigation.navigate('Recipient');
	};

	return (
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader title={navTitle} />

			<View style={styles.content}>
				<BodyM color="secondary">{errorMessage}</BodyM>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View style={styles.buttonContainer}>
					{isSlashpay && (
						<Button
							style={styles.button}
							variant="secondary"
							size="large"
							text={t('cancel')}
							testID="Close"
							onPress={handleClose}
						/>
					)}
					<Button
						style={styles.button}
						variant="primary"
						size="large"
						text={retryText}
						disabled={loading}
						onPress={handleRetry}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
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

export default memo(Error);
