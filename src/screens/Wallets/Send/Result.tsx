import React, { memo, ReactElement, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Lottie from 'lottie-react-native';

import { Subtitle, Text01S } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { toggleView } from '../../../store/actions/ui';
import { navigate } from '../../../navigation/root/RootNavigator';
import Store from '../../../store/types';
import type { SendScreenProps } from '../../../navigation/types';

const confettiSrc = require('../../../assets/lottie/confetti-green.json');

const Result = ({
	navigation,
	route,
}: SendScreenProps<'Result'>): ReactElement => {
	const { success, txId, errorTitle, errorMessage } = route.params;
	const insets = useSafeAreaInsets();
	const animationRef = useRef<Lottie>(null);
	const activityItems = useSelector((state: Store) => state.activity.items);
	const activityItem = activityItems.find((item) => item.id === txId);

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
				activityItem,
				extended: true,
			});
		}
	};

	const navigateToSend = (): void => {
		if (success) {
			toggleView({
				view: 'sendNavigation',
				data: { isOpen: false },
			});
		} else {
			navigation.navigate('ReviewAndSend');
		}
	};

	return (
		<GradientView style={styles.container}>
			<>
				{success && (
					<Lottie
						ref={animationRef}
						style={styles.confetti}
						source={confettiSrc}
						autoPlay
						loop
					/>
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
							style={styles.button1}
							variant="secondary"
							size="large"
							text="Show Details"
							onPress={navigateToTxDetails}
						/>
						<View style={styles.divider} />
					</>
				)}
				<Button
					style={styles.button2}
					size="large"
					text={success ? 'Close' : 'Try Again'}
					onPress={navigateToSend}
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
		position: 'absolute',
		height: '100%',
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
	button1: {
		flex: 2,
	},
	button2: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(Result);
