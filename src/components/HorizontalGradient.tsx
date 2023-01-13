import React, { ReactElement, useState, useEffect } from 'react';
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';
import {
	Canvas,
	LinearGradient,
	Rect,
	runTiming,
	useValue,
	vec,
} from '@shopify/react-native-skia';

type HorizontalGradientProps = {
	color: string;
	style?: StyleProp<ViewStyle>;
};

/**
 * This component draws a horizontal linear gradient, it has opacity animation on mount
 */
const HorizontalGradient = ({
	color,
	style,
}: HorizontalGradientProps): ReactElement => {
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
		runTiming(opacity, 0.7);
	}, [opacity]);

	return (
		<View style={style} onLayout={handleLayout}>
			<Canvas style={style}>
				<Rect x={0} y={0} width={width} height={height} opacity={opacity}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(width, 0)}
						positions={[0, 1]}
						colors={[color, 'rgba(0, 15, 28, 0.5)']}
					/>
				</Rect>
			</Canvas>
		</View>
	);
};

export default HorizontalGradient;
