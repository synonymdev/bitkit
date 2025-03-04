import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PressableProps, StyleSheet } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
	Easing,
} from 'react-native-reanimated';

import { __E2E__ } from '../constants/env';
import { useAppStatus } from '../hooks/useAppStatus';
import { Pressable } from '../styles/components';
import { ArrowsClockwiseIcon, PowerIcon, WarningIcon } from '../styles/icons';
import { BodyMSB } from '../styles/text';
import { IThemeColors } from '../styles/themes';

type Props = PressableProps & { showText?: boolean; showReady?: boolean };

const AppStatus = ({
	showText = false,
	showReady = false,
	style,
	testID,
	onPress,
}: Props): ReactNode => {
	const appStatus = useAppStatus();
	const rotation = useSharedValue(0);
	const opacity = useSharedValue(1);
	const { t } = useTranslation('wallet');

	useEffect(() => {
		if (__E2E__) {
			return;
		}

		if (appStatus === 'pending') {
			rotation.value = withRepeat(
				withSequence(
					// First half turn with easing
					withTiming(0.5, {
						duration: 800,
						easing: Easing.bezier(0.4, 0, 0.2, 1),
					}),
					// Second half turn with different easing
					withTiming(1, {
						duration: 1200,
						easing: Easing.bezier(0.4, 0, 0.2, 1),
					}),
				),
				-1,
				false,
			);
		} else {
			rotation.value = 0;
		}

		if (appStatus === 'error') {
			opacity.value = withRepeat(
				withSequence(
					withTiming(0.3, {
						duration: 600,
						easing: Easing.ease,
					}),
					withTiming(1, {
						duration: 600,
						easing: Easing.ease,
					}),
				),
				-1,
				true,
			);
		} else {
			opacity.value = 1;
		}
	}, [appStatus, rotation, opacity]);

	const spinStyle = useAnimatedStyle(() => {
		return {
			transform: [{ rotate: `${rotation.value * 360}deg` }],
		};
	});

	const fadeStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
		};
	});

	const appStatusColor = (): keyof IThemeColors => {
		if (appStatus === 'ready') {
			return 'green';
		}
		if (appStatus === 'pending') {
			return 'yellow';
		}
		return 'red';
	};

	const color = appStatusColor();

	if (appStatus === 'ready' && !showReady) {
		return null;
	}

	return (
		<Pressable style={[styles.root, style]} testID={testID} onPress={onPress}>
			{appStatus === 'ready' && (
				<PowerIcon color={color} width={24} height={24} />
			)}
			{appStatus === 'pending' && (
				<Animated.View style={spinStyle}>
					<ArrowsClockwiseIcon color={color} width={24} height={24} />
				</Animated.View>
			)}
			{appStatus === 'error' && (
				<Animated.View style={fadeStyle}>
					<WarningIcon color={color} width={24} height={24} />
				</Animated.View>
			)}
			{showText && <BodyMSB color={color}>{t('drawer.status')}</BodyMSB>}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default AppStatus;
