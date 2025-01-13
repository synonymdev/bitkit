import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import React, { ReactElement, useState } from 'react';
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';

type ToastGradientProps = {
	color: string;
	style?: StyleProp<ViewStyle>;
};

/**
 * This component draws a horizontal linear gradient, it has opacity animation on mount
 */
const ToastGradient = ({ color, style }: ToastGradientProps): ReactElement => {
	const [layout, setLayout] = useState({ width: 1, height: 1 });
	const { height, width } = layout;

	const handleLayout = (event: LayoutChangeEvent): void => {
		setLayout({
			width: event.nativeEvent.layout.width,
			height: event.nativeEvent.layout.height,
		});
	};

	return (
		<View style={style} onLayout={handleLayout}>
			<Canvas style={style}>
				<Rect x={0} y={0} width={width} height={height} opacity={0.75}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, height)}
						positions={[0, 1]}
						colors={[color, 'rgba(0, 0, 0, 1)']}
					/>
				</Rect>
			</Canvas>
		</View>
	);
};

export default ToastGradient;
