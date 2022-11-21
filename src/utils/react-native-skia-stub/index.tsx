import React, { ReactElement, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Mock } from '@shopify/react-native-skia/lib/module/mock';

export const Canvas = ({ style }): ReactElement => {
	const s = useMemo(
		() =>
			StyleSheet.compose(style, {
				backgroundColor: 'rgba(255, 255, 255, 0.1)',
			}),
		[style],
	);
	return <View style={s} />;
};
export const LinearGradient = (): ReactElement => <></>;
export const Rect = (): ReactElement => <></>;
export const Path = (): ReactElement => <></>;
export const RadialGradient = (): ReactElement => <></>;
export const BlurMask = (): ReactElement => <></>;
export const DashPathEffect = (): ReactElement => <></>;
export const Circle = (): ReactElement => <></>;
export const Paint = (): ReactElement => <></>;
export const vec = Mock.vec;
export const rect = Mock.rect;
export const Skia = Mock.Skia;
export const runTiming = (): undefined => {};
export const useValue = (): undefined => {};
export const useComputedValue = (): undefined => {};
export const useCanvas = (): object => ({
	size: {
		current: {
			width: 100,
			height: 100,
		},
	},
});

// export const useValue = Mock.useValue;
// export const useComputedValue = Mock.useComputedValue;
// export const runTiming = Mock.runTiming;
