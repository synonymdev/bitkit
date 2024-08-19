import React, { ReactElement, ReactNode, useState } from 'react';
import {
	LayoutChangeEvent,
	StyleProp,
	StyleSheet,
	ViewStyle,
} from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { View as ThemedView } from '../styles/components';

const GradientBackground = ({
	children,
	direction = 'top',
	style,
}: {
	children?: ReactNode;
	direction?: 'top' | 'bottom';
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const [size, setSize] = useState({ width: 0, height: 0 });
	const { height, width } = size;

	const onLayout = (event: LayoutChangeEvent): void => {
		const { layout } = event.nativeEvent;
		setSize({ height: layout.height, width: layout.width });
	};

	let colors = ['transparent', 'white'];
	if (direction === 'bottom') {
		colors = colors.reverse();
	}

	return (
		<ThemedView style={[styles.root, style]} onLayout={onLayout}>
			<Canvas style={styles.background}>
				<Rect x={0} y={0} width={width} height={height} opacity={0.16}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, height)}
						colors={colors}
					/>
				</Rect>
			</Canvas>
			{children}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		position: 'relative',
	},
	background: {
		position: 'absolute',
		resizeMode: 'stretch',
		top: 0,
		bottom: 0,
		width: '100%',
		height: undefined,
	},
});

export default GradientBackground;
