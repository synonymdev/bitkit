import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { BlurMask, Canvas, Rect } from '@shopify/react-native-skia';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import throttle from 'lodash.throttle';

import { View as ThemedView } from '../styles/components';
import useColors from '../hooks/colors';

const CIRCLE_SIZE = 32;
const GRAB_SIZE = 64;

const valueToX = (
	value: number,
	minimumValue: number,
	maximumValue: number,
	width: number,
): number => {
	let newValue = value;
	if (value < minimumValue) {
		newValue = minimumValue;
	}
	if (value > maximumValue) {
		newValue = maximumValue;
	}
	const delta = maximumValue - minimumValue;
	// Make sure we're not dividing by zero.
	if (delta === 0) {
		return 0;
	}
	return (width / delta) * newValue;
};

const xToValue = (
	x: number,
	minimumValue: number,
	maximumValue: number,
	width: number,
): number => {
	let newX = x;
	if (x < 0) {
		newX = 0;
	}
	if (x > width) {
		newX = width;
	}
	// Make sure we're not dividing by zero.
	if (width === 0) {
		return 0;
	}
	return ((maximumValue - minimumValue) / width) * newX;
};

const Glow = ({ style, width }): ReactElement => {
	const colors = useColors();
	const cStyle = useMemo(
		() => [style, { width: width + CIRCLE_SIZE * 2, height: CIRCLE_SIZE * 3 }],
		[width, style],
	);

	return (
		<Canvas style={cStyle}>
			<Rect
				x={CIRCLE_SIZE}
				y={CIRCLE_SIZE}
				width={width}
				height={CIRCLE_SIZE}
				opacity={0.4}
				color={colors.purple}>
				<BlurMask blur={20} style="normal" />
			</Rect>
		</Canvas>
	);
};

interface IFancySlider {
	minimumValue: number;
	maximumValue: number;
	value: number;
	onValueChange: Function;
}
const FancySlider = ({
	minimumValue,
	maximumValue,
	value,
	onValueChange,
}: IFancySlider): ReactElement => {
	const pan = useRef<any>(new Animated.ValueXY()).current;
	const active = useRef(false);
	const colors = useColors();
	const minTrackKolor = colors.purple;
	const maxTrackKolor = colors.orange;
	const [containerWidth, setContainerWidth] = useState(0);
	const endPosition = containerWidth === 0 ? 1 : containerWidth - CIRCLE_SIZE;

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const throttledOnValueChange = useCallback(throttle(onValueChange, 200), [
		onValueChange,
	]);

	const handleValueChange = useCallback(
		(x) => {
			if (!active.current) {
				return;
			}
			const v = xToValue(x, minimumValue, maximumValue, endPosition);
			throttledOnValueChange(v);
		},
		[throttledOnValueChange, minimumValue, maximumValue, endPosition],
	);

	const panResponder = useMemo(() => {
		// wait for containerWidth to be set
		if (endPosition === 1) {
			return { panHandlers: {} };
		}

		return PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				pan.setOffset({
					x: pan.x._value,
					y: pan.y._value,
				});
				active.current = true;
			},
			onPanResponderMove: Animated.event([null, { dx: pan.x }], {
				useNativeDriver: false,
			}),
			onPanResponderRelease: () => {
				pan.flattenOffset();
				if (pan.x._value < 0) {
					Animated.spring(pan, {
						toValue: { x: 0, y: 0 },
						useNativeDriver: false,
					}).start();
				} else if (pan.x._value > endPosition) {
					Animated.spring(pan, {
						toValue: { x: endPosition, y: 0 },
						useNativeDriver: false,
					}).start();
				}
				active.current = false;
			},
		});
	}, [endPosition, pan]);

	const circleTranslateX = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [0, endPosition],
	});

	const minTrackWidth = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [CIRCLE_SIZE / 2, endPosition + CIRCLE_SIZE / 2],
	});

	const maxTrackWidth = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [endPosition + CIRCLE_SIZE, CIRCLE_SIZE / 2],
	});

	useEffect(() => {
		const l = pan.addListener(({ x }) => handleValueChange(x));
		return () => pan.removeListener(l);
	}, [pan, handleValueChange]);

	useEffect(() => {
		if (active.current) {
			return;
		}
		const x = valueToX(value, minimumValue, maximumValue, endPosition);
		pan.setValue({ x, y: pan.y._value });
	}, [pan, value, minimumValue, maximumValue, endPosition]);

	return (
		<View style={styles.root}>
			<Glow width={containerWidth} style={styles.glow} />
			<View
				style={styles.container}
				onLayout={(e): void => {
					const ww = e.nativeEvent.layout.width;
					setContainerWidth((w) => (w === 0 ? ww : w));
				}}>
				<Animated.View
					style={[
						styles.minTrack,
						{
							backgroundColor: minTrackKolor,
							width: minTrackWidth,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.maxTrack,
						{
							backgroundColor: maxTrackKolor,
							width: maxTrackWidth,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.grap,
						{
							height: GRAB_SIZE,
							width: GRAB_SIZE,
							transform: [
								{
									translateX: circleTranslateX,
								},
							],
						},
					]}
					{...panResponder.panHandlers}>
					<ThemedView color="purple" style={styles.circle1}>
						<ThemedView color="white" style={styles.circle2} />
					</ThemedView>
				</Animated.View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		height: CIRCLE_SIZE,
		flexDirection: 'row',
	},
	container: {
		flexDirection: 'row',
		flex: 1,
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
	},
	minTrack: {
		borderRadius: 8,
		flexDirection: 'row',
		height: 8,
		flex: 1,
		position: 'absolute',
		left: 2,
		top: 12,
		bottom: 0,
	},
	maxTrack: {
		borderRadius: 8,
		flexDirection: 'row',
		height: 8,
		flex: 1,
		position: 'absolute',
		right: 0,
		top: 12,
		bottom: 0,
	},
	grap: {
		position: 'absolute',
		left: (CIRCLE_SIZE - GRAB_SIZE) / 2,
		top: (CIRCLE_SIZE - GRAB_SIZE) / 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circle1: {
		borderRadius: CIRCLE_SIZE,
		height: CIRCLE_SIZE,
		width: CIRCLE_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circle2: {
		borderRadius: 16,
		height: 16,
		width: 16,
	},
	glow: {
		position: 'absolute',
		top: -CIRCLE_SIZE,
		left: -CIRCLE_SIZE,
		right: -CIRCLE_SIZE,
	},
});

export default memo(FancySlider);
