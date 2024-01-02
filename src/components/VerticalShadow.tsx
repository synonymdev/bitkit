import React, { ReactElement, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';

/**
 * This component draws vertical gradient, it has opacity animation on mount
 */
const VerticalShadow = (): ReactElement => {
	const [layout, setLayout] = useState({ width: 1, height: 1 });
	const { height, width } = layout;

	const handleLayout = (event: LayoutChangeEvent): void => {
		setLayout({
			width: event.nativeEvent.layout.width,
			height: event.nativeEvent.layout.height,
		});
	};

	return (
		<View style={styles.shadowCanvas} onLayout={handleLayout}>
			<Canvas style={styles.shadowCanvas}>
				<Rect x={0} y={0} width={width} height={height}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, height)}
						colors={['black', 'transparent']}
					/>
				</Rect>
			</Canvas>
		</View>
	);
};

const styles = StyleSheet.create({
	shadowCanvas: {
		flex: 1,
	},
});

export default VerticalShadow;
