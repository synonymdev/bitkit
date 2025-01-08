import React, { ReactElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
	Easing,
	interpolate,
	interpolateColor,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import colors from '../styles/colors';
import { IThemeColors } from '../styles/themes';

const duration = 300;
const defaultHeight = 32;
const defaultWidth = 52;

const Switch = ({
	value,
	disabled,
	color,
	onValueChange,
}: {
	value: boolean;
	disabled?: boolean;
	color?: keyof IThemeColors;
	onValueChange?: () => void;
}): ReactElement => {
	const height = useSharedValue(defaultHeight);
	const width = useSharedValue(defaultWidth);
	const sharedValue = useDerivedValue(() => {
		return value ? 1 : 0;
	});

	const thumbColor = disabled ? '#A0A0A0' : colors.white;
	const trackColor = color ? colors[color] : colors.brand;
	const trackColors = { on: trackColor, off: '#3A3A3C' };

	const trackAnimatedStyle = useAnimatedStyle(() => {
		const animatedColor = interpolateColor(
			sharedValue.value,
			[0, 1],
			[trackColors.off, trackColors.on],
		);
		const colorValue = withTiming(animatedColor, {
			duration,
			easing: Easing.inOut(Easing.ease),
		});

		return {
			backgroundColor: colorValue,
			borderRadius: height.value / 2,
		};
	});

	const thumbAnimatedStyle = useAnimatedStyle(() => {
		const moveValue = interpolate(
			sharedValue.value,
			[0, 1],
			[0, width.value - height.value],
		);
		const translateValue = withTiming(moveValue, {
			duration,
			easing: Easing.bezier(0.61, 0.46, 0.3, 1.07),
		});

		return {
			transform: [{ translateX: translateValue }],
			borderRadius: height.value / 2,
		};
	});

	const onPress = (): void => {
		if (!disabled) {
			onValueChange?.();
		}
	};

	return (
		<Pressable onPress={onPress}>
			<Animated.View
				style={[styles.track, trackAnimatedStyle]}
				onLayout={(e) => {
					height.value = e.nativeEvent.layout.height;
					width.value = e.nativeEvent.layout.width;
				}}>
				<Animated.View
					style={[
						styles.thumb,
						thumbAnimatedStyle,
						{ backgroundColor: thumbColor },
					]}
				/>
			</Animated.View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	track: {
		alignItems: 'flex-start',
		height: defaultHeight,
		width: defaultWidth,
		padding: 4,
	},
	thumb: {
		height: '100%',
		aspectRatio: 1,
	},
});

export default Switch;
