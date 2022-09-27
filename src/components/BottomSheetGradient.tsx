import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import {
	Canvas,
	LinearGradient,
	Rect,
	rect,
	useCanvas,
	useComputedValue,
	vec,
} from '@shopify/react-native-skia';

import { AnimatedView, View as ThemedView } from '../styles/components';
import colors, { IColors } from '../styles/colors';

const Gradient = ({
	startColor,
}: {
	startColor: keyof IColors;
}): ReactElement => {
	const { size } = useCanvas();
	const rct = useComputedValue(
		() => rect(0, 0, size.current.width, size.current.height),
		[size],
	);
	const end = useComputedValue(() => vec(0, size.current.height), [size]);
	const gradientColors = [colors[startColor] ?? colors.gray6, 'black'];

	return (
		<Rect x={0} y={0} rect={rct}>
			<LinearGradient start={vec(0, 0)} end={end} colors={gradientColors} />
		</Rect>
	);
};

const GradientWrapper = ({
	animatedContentHeight,
	startColor = 'gray6',
	style,
}: {
	animatedContentHeight: SharedValue<number>;
	startColor: keyof IColors;
	style: StyleProp<ViewStyle>;
}): ReactElement => {
	const animatedStyle = useAnimatedStyle(
		() => ({ height: animatedContentHeight.value + 32 }),
		[animatedContentHeight],
	);

	return (
		<ThemedView style={[styles.root, style]}>
			<AnimatedView style={animatedStyle}>
				<Canvas style={styles.canvas}>
					<Gradient startColor={startColor} />
				</Canvas>
			</AnimatedView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		overflow: 'hidden',
	},
	canvas: {
		flex: 1,
	},
});

export default memo(GradientWrapper);
