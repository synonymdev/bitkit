import React, { memo, ReactElement, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Lottie from 'lottie-react-native';

import { Subtitle, Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { toggleView } from '../../../store/actions/ui';
import { navigate } from '../../../navigation/root/RootNavigator';
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
} from '../../../store/reselect/wallet';

const confettiSrc = require('../../../assets/lottie/confetti-green.json');

const Result = ({
	navigation,
	route,
}: SendScreenProps<'Result'>): ReactElement => {
	const { success, txId, errorTitle, errorMessage } = route.params;
	const insets = useSafeAreaInsets();
	const animationRef = useRef<Lottie>(null);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const activityItem = useSelector((state: Store) => {
		// TODO: make sure txId is always defined
		return activityItemSelector(state, txId ?? '');
	});

	const buttonContainer = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const imageSrc = success
		? require('../../../assets/illustrations/check.png')
		: require('../../../assets/illustrations/cross.png');

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
			toggleView({
				view: 'sendNavigation',
				data: { isOpen: false },
			});
			navigate('ActivityDetail', {
				id: activityItem.id,
				extended: true,
			});
		}
	};

	const onContinue = async (): Promise<void> => {
		if (success) {
			toggleView({
				view: 'sendNavigation',
				data: { isOpen: false },
			});
		} else {
			/*
				TODO: Add ability to distinguish between errors sent to this component.
				 If unable to connect to or broadcast through Electrum, attempt to broadcast using the Blocktank api.
				 If unable to properly create a valid transaction for any reason, reset the tx state as done below.
			*/
			//If unable to broadcast for any reason, reset the transaction object and try again.
			await resetOnChainTransaction({ selectedWallet, selectedNetwork });
			await setupOnChainTransaction({
				selectedWallet,
				selectedNetwork,
			});
			// The transaction was reset due to an unknown broadcast or construction error.
			// Navigate back to the main send screen to re-enter information.
			navigation.navigate('Recipient');
		}
	};

	return (
		<GradientView style={styles.container}>
			<>
				{success && (
					<View style={styles.confetti} pointerEvents="none">
						<Lottie ref={animationRef} source={confettiSrc} autoPlay loop />
					</View>
				)}
			</>

			{success ? (
				<BottomSheetNavigationHeader
					title="Bitcoin Sent"
					displayBackButton={false}
				/>
			) : (
				<BottomSheetNavigationHeader title="Transaction Failed" />
			)}

			<View style={styles.error}>
				{errorTitle && (
					<Subtitle style={styles.errorTitle} color="red">
						{errorTitle}
					</Subtitle>
				)}
				{errorMessage && <Text01S color="red">{errorMessage}</Text01S>}
			</View>

			<GlowImage
				image={imageSrc}
				imageSize={200}
				glowColor={success ? 'green' : 'red'}
			/>

			<View style={buttonContainer}>
				{success && activityItem && (
					<>
						<Button
							style={styles.button}
							variant="secondary"
							size="large"
							text="Details"
							onPress={navigateToTxDetails}
						/>
						<View style={styles.divider} />
					</>
				)}
				<Button
					style={styles.button}
					size="large"
					text={success ? 'Close' : 'Try Again'}
					onPress={onContinue}
				/>
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
