import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Lottie from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

import { Subtitle, Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { closeBottomSheet } from '../../../store/actions/ui';
import { rootNavigation } from '../../../navigation/root/RootNavigator';
import Store from '../../../store/types';
import type { SendScreenProps } from '../../../navigation/types';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../../store/actions/wallet';
import { activityItemSelector } from '../../../store/reselect/activity';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import { useSlashtags } from '../../../components/SlashtagsProvider';
import { processInputData } from '../../../utils/scanner';
import { showErrorNotification } from '../../../utils/notifications';

const confettiSrc = require('../../../assets/lottie/confetti-green.json');

const Result = ({
	navigation,
	route,
}: SendScreenProps<'Result'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { success, txId, errorTitle, errorMessage } = route.params;
	const insets = useSafeAreaInsets();
	const animationRef = useRef<Lottie>(null);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const transaction = useSelector(transactionSelector);
	const activityItem = useSelector((state: Store) => {
		// TODO: make sure txId is always defined
		return activityItemSelector(state, txId ?? '');
	});
	const { sdk } = useSlashtags();
	const [loading, setLoading] = useState(false);

	const buttonContainer = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	let imageSrc;
	let title;
	let glowColor;
	let closeText;
	let retryText;
	let error;

	if (success) {
		imageSrc = require('../../../assets/illustrations/check.png');
		title = t('send_sent');
		glowColor = 'green';
		closeText = t('close');
		error = <View style={styles.error} />;
	} else if (transaction.lightningInvoice && transaction.slashTagsUrl) {
		imageSrc = require('../../../assets/illustrations/exclamation-mark.png');
		title = t('send_instant_failed');
		glowColor = 'yellow';
		closeText = t('cancel');
		retryText = loading ? (
			<>
				<ActivityIndicator />
				{t('send_regular')}
			</>
		) : (
			t('send_regular')
		);
		error = (
			<View style={styles.error}>
				<Text01S>{t('send_error_slash_ln')}</Text01S>
			</View>
		);
	} else {
		imageSrc = require('../../../assets/illustrations/cross.png');
		title = t('send_error_tx_failed');
		glowColor = 'red';
		closeText = t('cancel');
		retryText = t('try_again');
		error = (
			<View style={styles.error}>
				{errorTitle && (
					<Subtitle style={styles.errorTitle} color="red">
						{errorTitle}
					</Subtitle>
				)}
				{errorMessage && <Text01S color="red">{errorMessage}</Text01S>}
			</View>
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
			closeBottomSheet('sendNavigation');
			rootNavigation.navigate('ActivityDetail', {
				id: activityItem.id,
				extended: true,
			});
		}
	};

	const handleClose = (): void => {
		closeBottomSheet('sendNavigation');
	};

	const handleRetry = async (): Promise<void> => {
		if (transaction.lightningInvoice && transaction.slashTagsUrl) {
			setLoading(true);
			resetOnChainTransaction({
				selectedWallet,
				selectedNetwork,
			});
			await setupOnChainTransaction({
				selectedNetwork,
				selectedWallet,
			});
			const res = await processInputData({
				data: transaction.slashTagsUrl,
				source: 'sendScanner',
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
			showErrorNotification({
				title: t('send_error_contact'),
				message: res.error.message,
			});

			return;
		}

		/*
			TODO: Add ability to distinguish between errors sent to this component.
			If unable to connect to or broadcast through Electrum, attempt to broadcast using the Blocktank api.
			If unable to properly create a valid transaction for any reason, reset the tx state as done below.
		*/
		//If unable to broadcast for any reason, reset the transaction object and try again.
		resetOnChainTransaction({ selectedWallet, selectedNetwork });
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

			{error}

			<GlowImage image={imageSrc} imageSize={200} glowColor={glowColor} />

			<View style={buttonContainer}>
				{success && activityItem && (
					<>
						<Button
							style={styles.button}
							variant="primary"
							size="large"
							text={t('send_details')}
							onPress={navigateToTxDetails}
						/>
						<View style={styles.divider} />
					</>
				)}
				<Button
					style={styles.button}
					variant="secondary"
					size="large"
					text={closeText}
					onPress={handleClose}
					testID="Close"
				/>
				{!success && (
					<>
						<View style={styles.divider} />
						<Button
							style={styles.button}
							variant="primary"
							size="large"
							text={retryText}
							onPress={handleRetry}
							disabled={loading}
						/>
					</>
				)}
			</View>
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
	error: {
		marginHorizontal: 32,
	},
	errorTitle: {
		marginBottom: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		paddingHorizontal: 16,
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
