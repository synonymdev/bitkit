import React, { memo } from 'react';
import { Animated, Easing } from 'react-native';
import { __DISABLE_LOOP_ANIMATION__ } from '../constants/env';

const imageSrc = require('../assets/spinner-gradient.png');

export const LoadingSpinner = memo(({ size = 45 }: { size?: number }) => {
	const spinValue = new Animated.Value(0);

	if (__DISABLE_LOOP_ANIMATION__) {
		return (
			<Animated.Image style={{ height: size, width: size }} source={imageSrc} />
		);
	}

	Animated.loop(
		Animated.timing(spinValue, {
			toValue: 360,
			duration: 100000,
			easing: Easing.linear,
			useNativeDriver: true,
		}),
	).start();

	return (
		<Animated.Image
			style={{ height: size, width: size, transform: [{ rotate: spinValue }] }}
			source={imageSrc}
		/>
	);
});
