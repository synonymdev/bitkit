import React, { ReactElement, useState, useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
	Canvas,
	LinearGradient,
	Rect,
	runTiming,
	useValue,
	vec,
} from '@shopify/react-native-skia';

/**
 * This component draws vertical gradint, it has opacity animation on mount
 */
const VerticalShadow = (): ReactElement => {
	const [layout, setLayout] = useState({ width: 1, height: 1 });
	const opacity = useValue(0);

	const handleLayout = (event: LayoutChangeEvent): void => {
		setLayout({
			width: event.nativeEvent.layout.width,
			height: event.nativeEvent.layout.height,
		});
	};

	const { height, width } = layout;

	useEffect(() => {
		runTiming(opacity, 1);
	}, [opacity]);

	return (
		<View style={styles.shadowCanvas} onLayout={handleLayout}>
			<Canvas style={styles.shadowCanvas}>
				<Rect x={0} y={0} width={width} height={height} opacity={opacity}>
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
