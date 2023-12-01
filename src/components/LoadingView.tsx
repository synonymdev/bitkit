import React, { ReactElement, memo, useEffect, useState } from 'react';
import { View, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
	cancelAnimation,
	Easing,
	useSharedValue,
	withRepeat,
	withTiming,
	useAnimatedStyle,
} from 'react-native-reanimated';
import { __E2E__ } from '../constants/env';

const imageSrc = require('../assets/spinner-gradient.png');

const LoadingView = memo(
	({
		children,
		loading,
		delay = 1000,
		spinnerSize = 45,
		style,
	}: {
		children: ReactElement;
		loading: boolean;
		delay: number;
		spinnerSize?: number;
		style?: StyleProp<ViewStyle>;
	}) => {
		const spinValue = useSharedValue(0);
		const [showLoading, setShowLoading] = useState(false);

		useEffect(() => {
			if (__E2E__) {
				return;
			}
			const timeout = setTimeout(() => setShowLoading(true), delay);

			spinValue.value = withRepeat(
				withTiming(360, {
					duration: 1000,
					easing: Easing.linear,
				}),
				-1,
			);

			return (): void => {
				clearTimeout(timeout);
				cancelAnimation(spinValue);
			};
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		const animatedStyle = useAnimatedStyle(() => {
			return {
				transform: [{ rotateZ: `${spinValue.value}deg` }],
			};
		}, [spinValue.value]);

		return (
			<View style={style}>
				{loading && showLoading ? (
					<View style={styles.loading}>
						<Animated.Image
							style={[
								{ ...(__E2E__ ? {} : animatedStyle) },
								{ height: spinnerSize, width: spinnerSize },
							]}
							source={imageSrc}
						/>
					</View>
				) : (
					children
				)}
			</View>
		);
	},
);

const styles = StyleSheet.create({
	loading: {
		alignItems: 'center',
	},
});

export default memo(LoadingView);
