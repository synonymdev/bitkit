import React, { memo, ReactElement, ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import {
	Canvas,
	LinearGradient,
	Rect,
	rect,
	useCanvas,
	useComputedValue,
	vec,
} from '@shopify/react-native-skia';

import { View as ThemedView } from '../styles/components';
import colors, { IColors } from '../styles/colors';

const Gradient = ({
	startColor,
	endColor,
}: {
	startColor: keyof IColors;
	endColor: keyof IColors;
}): ReactElement => {
	const { size } = useCanvas();
	const rct = useComputedValue(
		() => rect(0, 0, size.current.width, size.current.height),
		[size],
	);
	const end = useComputedValue(() => vec(0, size.current.height), [size]);
	const gradientColors = [
		colors[startColor] ?? colors.gray6,
		colors[endColor] ?? 'black',
	];

	return (
		<Rect x={0} y={0} rect={rct}>
			<LinearGradient start={vec(0, 0)} end={end} colors={gradientColors} />
		</Rect>
	);
};

const GradientView = ({
	startColor = 'gray6',
	endColor = 'black',
	style,
	children,
}: {
	startColor?: keyof IColors;
	endColor?: keyof IColors;
	style?: StyleProp<ViewStyle>;
	children?: ReactNode;
}): ReactElement => {
	return (
		<ThemedView style={style}>
			<Canvas style={styles.canvas}>
				<Gradient startColor={startColor} endColor={endColor} />
			</Canvas>
			{children}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	canvas: {
		position: 'absolute',
		height: '100%',
		width: '100%',
	},
});

export default memo(GradientView);
