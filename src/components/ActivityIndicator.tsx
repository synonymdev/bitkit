import {
	Canvas,
	Path,
	Skia,
	SweepGradient,
	vec,
} from '@shopify/react-native-skia';
import React, { ReactElement, useEffect, useMemo } from 'react';
import Animated, {
	Easing,
	FadeIn,
	FadeOut,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

export const ActivityIndicator = ({
	size = 32,
}: {
	size?: number;
}): ReactElement => {
	const strokeWidth = size / 12;
	const radius = (size - strokeWidth) / 2;
	const canvasSize = size + 30;

	const circle = useMemo(() => {
		const skPath = Skia.Path.Make();
		skPath.addCircle(canvasSize / 2, canvasSize / 2, radius);
		return skPath;
	}, [canvasSize, radius]);

	const progress = useSharedValue(0);

	useEffect(() => {
		progress.value = withRepeat(
			withTiming(1, { duration: 1200, easing: Easing.linear }),
			-1,
			false,
		);
	}, [progress]);

	const rContainerStyle = useAnimatedStyle(() => {
		return {
			transform: [{ rotate: `${2 * Math.PI * progress.value}rad` }],
		};
	});

	return (
		<Animated.View
			style={rContainerStyle}
			entering={FadeIn.duration(1000)}
			exiting={FadeOut.duration(1000)}>
			<Canvas style={{ width: canvasSize, height: canvasSize }}>
				<Path
					start={0.1}
					end={0.94}
					path={circle}
					style="stroke"
					strokeWidth={strokeWidth}
					strokeCap="round">
					<SweepGradient
						c={vec(canvasSize / 2, canvasSize / 2)}
						colors={['black', 'white']}
					/>
				</Path>
			</Canvas>
		</Animated.View>
	);
};
