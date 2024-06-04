import React, { ReactElement, useEffect } from 'react';
import {
	View,
	StyleSheet,
	Image,
	useWindowDimensions,
	TextInput,
	Platform,
} from 'react-native';
import Animated, {
	Easing,
	FadeOut,
	useAnimatedProps,
	useDerivedValue,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Display } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import { __E2E__ } from '../../constants/env';

const circleSrc = require('../../assets/illustrations/loading-circle.png');
const rocketSrc = require('../../assets/illustrations/rocket.png');
const rocketSize = 256;

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedText = Animated.createAnimatedComponent(TextInput);

const LoadingWalletScreen = ({
	isRestoring = false,
}: {
	isRestoring?: boolean;
}): ReactElement => {
	const { t } = useTranslation('onboarding');
	const { width } = useWindowDimensions();
	const animationDuration = isRestoring ? 16000 : 1500;

	const progressValue = useSharedValue(0);
	const progressText = useDerivedValue(() => {
		return `${Math.round(progressValue.value)}%`;
	});
	const textAnimatedProps = useAnimatedProps(() => {
		return { text: progressText.value, defaultValue: progressText.value };
	});

	useEffect(() => {
		progressValue.value = withTiming(100, {
			duration: animationDuration,
			easing: Easing.linear,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const circleAnimation = (): { initialValues: {}; animations: {} } => {
		'worklet';
		const initialValues = { transform: [{ rotate: '0deg' }] };
		const animations = {
			transform: [
				{
					rotate: withRepeat(
						withSequence(
							withTiming('-180deg', {
								duration: 1500,
								easing: Easing.inOut(Easing.ease),
							}),
							withDelay(
								100,
								withTiming('-360deg', {
									duration: 1500,
									easing: Easing.inOut(Easing.ease),
								}),
							),
						),
						-1,
					),
				},
			],
		};
		return { initialValues, animations };
	};

	const rocketAnimation = (): { initialValues: {}; animations: {} } => {
		'worklet';
		const initialValues = {
			transform: [{ translateX: 0 }, { translateY: 0 }],
		};

		const animations = {
			transform: [
				{
					translateX: withRepeat(
						withTiming(width + rocketSize, { duration: 4000 }),
						-1,
					),
				},
				{
					translateY: withRepeat(
						withTiming(-(width + rocketSize), { duration: 4000 }),
						-1,
					),
				},
			],
		};

		return { initialValues, animations };
	};

	return (
		<View style={styles.root}>
			<SafeAreaInset type="top" />
			<View style={styles.content}>
				<View style={styles.progress}>
					<View style={styles.circleContainer}>
						<Animated.Image
							style={styles.circleImage}
							source={circleSrc}
							entering={__E2E__ ? undefined : circleAnimation}
						/>
					</View>
					<View style={styles.progressContainer}>
						<AnimatedText
							style={styles.progressText}
							animatedProps={textAnimatedProps}
							editable={false}
						/>
					</View>
				</View>
				<Display>
					<Trans
						t={t}
						i18nKey="loading_header"
						components={{ accent: <Display color="brand" /> }}
					/>
				</Display>
			</View>
			<View style={styles.rocketContainer}>
				<AnimatedView
					entering={__E2E__ ? undefined : rocketAnimation}
					// exiting animation is disabled on Android due to a bug in reanimated
					// Black screen appears after wallet restore
					exiting={__E2E__ || Platform.OS === 'android' ? undefined : FadeOut}
					color="transparent">
					<Image style={styles.rocketImage} source={rocketSrc} />
				</AnimatedView>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 32,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
	},
	progress: {
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		marginBottom: 32,
		height: 192,
		width: 192,
	},
	progressContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	progressText: {
		fontFamily: 'InterTight-Bold',
		fontSize: 48,
		color: '#FF4400',
		letterSpacing: -1,
	},
	circleContainer: {
		position: 'absolute',
	},
	circleImage: {
		height: 192,
		width: 192,
	},
	rocketContainer: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'flex-end',
		zIndex: -1,
	},
	rocketImage: {
		position: 'absolute',
		left: -290,
		bottom: -210,
	},
});

export default LoadingWalletScreen;
