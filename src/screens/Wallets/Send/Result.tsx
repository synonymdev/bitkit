import React, {
	memo,
	ReactElement,
	useCallback,
	useRef,
	useState,
} from 'react';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Lottie from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

import { Subtitle, Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { rootNavigation } from '../../../navigation/root/RootNavigator';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';

import type { SendScreenProps } from '../../../navigation/types';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../../store/actions/wallet';
import { closeSheet } from '../../../store/slices/ui';
import { activityItemSelector } from '../../../store/reselect/activity';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import { useSlashtags } from '../../../components/SlashtagsProvider';
import AmountToggle from '../../../components/AmountToggle';
import { processInputData } from '../../../utils/scanner';
import { showToast } from '../../../utils/notifications';

const confettiSrc = require('../../../assets/lottie/confetti-green.json');

const Result = ({
	navigation,
	route,
}: SendScreenProps<'Result'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { success, txId, errorTitle, errorMessage } = route.params;
	const animationRef = useRef<Lottie>(null);
	const dispatch = useAppDispatch();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const transaction = useAppSelector(transactionSelector);
	const activityItem = useAppSelector((state) => {
		// TODO: make sure txId is always defined
		return activityItemSelector(state, txId ?? '');
	});
	const { sdk } = useSlashtags();
	const [loading, setLoading] = useState(false);

	let imageSrc;
	let title;
	let glowColor;
	let retryText;
	let error;

	const isSlashpay = transaction.lightningInvoice && transaction.slashTagsUrl;

	if (success) {
		imageSrc = require('../../../assets/illustrations/check.png');
		title = t('send_sent');
		glowColor = 'green';
		error = <></>;
	} else if (transaction.lightningInvoice && transaction.slashTagsUrl) {
		imageSrc = require('../../../assets/illustrations/exclamation-mark.png');
		title = t('send_instant_failed');
		glowColor = 'yellow';
		retryText = loading ? (
			<>
				<ActivityIndicator />
				{t('send_regular')}
			</>
		) : (
			t('send_regular')
		);
		error = <Text01S color="gray1">{t('send_error_slash_ln')}</Text01S>;
	} else {
		imageSrc = require('../../../assets/illustrations/cross.png');
		title = t('send_error_tx_failed');
		glowColor = 'red';
		retryText = t('try_again');
		error = (
			<>
				{errorTitle && (
					<Subtitle style={styles.errorTitle} color="red">
						{errorTitle}
					</Subtitle>
				)}
				{errorMessage && <Text01S color="red">{errorMessage}</Text01S>}
			</>
		);
	}

	// TEMP: fix iOS animation autoPlay
	// @see https://github.com/lottie-react-native/lottie-react-native/issues/832
	useFocusEffect(
		useCallback(() => {
			if (Platform.OS === 'ios') {
				animationRef.current?.reset();
				setTimeout(() => {
					animationRef.current?.play();
				}, 0);
			}
		}, []),
	);

	const navigateToTxDetails = (): void => {
		if (activityItem) {
			dispatch(closeSheet('sendNavigation'));
			rootNavigation.navigate('ActivityDetail', {
				id: activityItem.id,
				extended: true,
			});
		}
	};

	const handleClose = (): void => {
		dispatch(closeSheet('sendNavigation'));
	};

	const handleRetry = async (): Promise<void> => {
		if (transaction.lightningInvoice && transaction.slashTagsUrl) {
			setLoading(true);
			resetSendTransaction({
				selectedWallet,
				selectedNetwork,
			});
			await setupOnChainTransaction({
				selectedNetwork,
				selectedWallet,
			});
			const res = await processInputData({
				data: transaction.slashTagsUrl,
				source: 'send',
				sdk,
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
				type: 'error',
				title: t('send_error_contact'),
				description: res.error.message,
			});

			return;
		}

		/*
			TODO: Add ability to distinguish between errors sent to this component.
			If unable to connect to or broadcast through Electrum, attempt to broadcast using the Blocktank api.
			If unable to properly create a valid transaction for any reason, reset the tx state as done below.
		*/
		//If unable to broadcast for any reason, reset the transaction object and try again.
		resetSendTransaction({ selectedWallet, selectedNetwork });
		await setupOnChainTransaction({
			selectedWallet,
			selectedNetwork,
		});
		// The transaction was reset due to an unknown broadcast or construction error.
		// Navigate back to the main send screen to re-enter information.
		navigation.navigate('Recipient');
	};

	return (
		<GradientView style={styles.container}>
			<>
				{success && (
					<View
						testID="SendSuccess"
						style={styles.confetti}
						pointerEvents="none">
						<Lottie ref={animationRef} source={confettiSrc} autoPlay loop />
					</View>
				)}
			</>

			<BottomSheetNavigationHeader title={title} displayBackButton={!success} />

			<View style={styles.content}>
				{activityItem && (
					<AmountToggle
						sats={activityItem.value}
						reverse={true}
						space={12}
						testID="NewTxPrompt"
						onPress={navigateToTxDetails}
					/>
				)}

				{error}

				<GlowImage image={imageSrc} imageSize={200} glowColor={glowColor} />

				<View style={styles.buttonContainer}>
					{success ? (
						<>
							<Button
								style={styles.button}
								variant="secondary"
								size="large"
								disabled={!activityItem}
								text={t('send_details')}
								onPress={navigateToTxDetails}
							/>
							<View style={styles.divider} />
							<Button
								style={styles.button}
								size="large"
								text={t('close')}
								testID="Close"
								onPress={handleClose}
							/>
						</>
					) : (
						<>
							{isSlashpay && (
								<>
									<Button
										style={styles.button}
										variant="secondary"
										size="large"
										text={t('cancel')}
										testID="Close"
										onPress={handleClose}
									/>
									<View style={styles.divider} />
								</>
							)}
							<Button
								style={styles.button}
								variant="primary"
								size="large"
								text={retryText}
								disabled={loading}
								onPress={handleRetry}
							/>
						</>
					)}
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
	confetti: {
		...StyleSheet.absoluteFillObject,
		// fix Android confetti height
		...Platform.select({
			android: {
				width: '200%',
			},
		}),
		zIndex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	errorTitle: {
		marginBottom: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(Result);
