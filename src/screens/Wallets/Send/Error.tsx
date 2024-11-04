import React, { memo, ReactElement } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BodyM } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/buttons/Button';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { processUri } from '../../../utils/scanner/scanner';
import { showToast } from '../../../utils/notifications';
import type { SendScreenProps } from '../../../navigation/types';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../../store/actions/wallet';
import { closeSheet, updateUi } from '../../../store/slices/ui';
import { transactionSelector } from '../../../store/reselect/wallet';

const imageCross = require('../../../assets/illustrations/cross.png');
const imageExclamation = require('../../../assets/illustrations/exclamation-mark.png');

const Error = ({
	navigation,
	route,
}: SendScreenProps<'Error'>): ReactElement => {
	const { t } = useTranslation('wallet');
	let { errorMessage } = route.params;
	const dispatch = useAppDispatch();
	const transaction = useAppSelector(transactionSelector);
	const { lightningInvoice, slashTagsUrl } = transaction;

	const isSlashpayLightning = !!slashTagsUrl && !!lightningInvoice;

	let navTitle = t('send_error_tx_failed');
	let imageSrc = imageCross;
	let retryText = t('try_again');

	if (isSlashpayLightning) {
		imageSrc = imageExclamation;
		navTitle = t('send_instant_failed');
		errorMessage = t('send_error_slash_ln');
		retryText = t('send_regular');
	}

	const handleClose = (): void => {
		dispatch(closeSheet('sendNavigation'));
	};

	const handleRetry = async (): Promise<void> => {
		if (isSlashpayLightning) {
			dispatch(updateUi({ paymentMethod: 'onchain' }));
			const res = await processUri({
				uri: slashTagsUrl,
				source: 'send',
				skipLightning: true,
			});
			if (res.isErr()) {
				showToast({
					type: 'warning',
					title: t('other:contact_pay_error'),
					description: t('other:try_again'),
				});
			}
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
					{isSlashpayLightning && (
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
