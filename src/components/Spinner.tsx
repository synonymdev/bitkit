import React, { memo, useEffect } from 'react';
import { ImageStyle } from 'react-native';
import Animated, {
	cancelAnimation,
	Easing,
	useSharedValue,
	withRepeat,
	withTiming,
	useAnimatedStyle,
	AnimateStyle,
} from 'react-native-reanimated';
import { __E2E__ } from '../constants/env';

const imageSrc = require('../assets/spinner-gradient.png');

const LoadingSpinner = memo(
	({
		size = 45,
		style,
	}: {
		size?: number;
		style?: AnimateStyle<ImageStyle>;
	}) => {
		const spinValue = useSharedValue(0);

		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		useEffect(() => {
			if (__E2E__) {
				return;
			}
			spinValue.value = withRepeat(
				withTiming(360, {
					duration: 1000,
					easing: Easing.linear,
				}),
				-1,
			);
			return (): void => cancelAnimation(spinValue);
		}, []);

		const animatedStyle = useAnimatedStyle(() => {
			return {
				transform: [{ rotateZ: `${spinValue.value}deg` }],
			};
		}, [spinValue.value]);

		return (
			<Animated.Image
				style={[
					{ ...(__E2E__ ? {} : animatedStyle) },
					{ height: size, width: size },
					style,
				]}
				source={imageSrc}
			/>
		);
	},
);

export default memo(LoadingSpinner);
