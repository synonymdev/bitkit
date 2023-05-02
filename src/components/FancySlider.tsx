import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import throttle from 'lodash.throttle';

import { View as ThemedView } from '../styles/components';
import useColors from '../hooks/colors';

const CIRCLE_SIZE = 32;
const GRAB_SIZE = 64;
const SNAP_POINT_SIZE = 5;

const valueToX = (
	value: number,
	startValue: number,
	endValue: number,
	width: number,
): number => {
	let newValue = value;
	if (value < startValue) {
		newValue = startValue;
	}
	if (value > endValue) {
		newValue = endValue;
	}
	const delta = endValue - startValue;
	// Make sure we're not dividing by zero.
	if (delta === 0) {
		return 0;
	}
	return (width / delta) * newValue;
};

const xToValue = (
	x: number,
	startValue: number,
	endValue: number,
	width: number,
): number => {
	let newX = x;
	if (x < 0) {
		newX = 0;
	}
	if (x > width) {
		newX = width;
	}
	const delta = endValue - startValue;
	// Make sure we're not dividing by zero.
	if (width === 0) {
		return 0;
	}
	return (delta / width) * newX;
};

interface IFancySlider {
	startValue: number;
	endValue: number;
	maxValue: number;
	value: number;
	snapPoint?: number;
	onValueChange: (value: number) => void;
}

const FancySlider = ({
	startValue,
	endValue,
	maxValue,
	value,
	snapPoint,
	onValueChange,
}: IFancySlider): ReactElement => {
	const pan = useRef<any>(new Animated.ValueXY()).current;
	const active = useRef(false);
	const colors = useColors();
	const minTrackColor = colors.purple;
	const maxTrackColor = colors.orange;
	const disabledTrackColor = colors.orange50;
	const [containerWidth, setContainerWidth] = useState(0);
	const endPosition = containerWidth === 0 ? 1 : containerWidth - CIRCLE_SIZE;
	const maxEndPosition = valueToX(maxValue, startValue, endValue, endPosition);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const throttledOnValueChange = useCallback(throttle(onValueChange, 100), [
		onValueChange,
	]);

	const handleValueChange = useCallback(
		(x: number) => {
			if (!active.current) {
				return;
			}
			const v = xToValue(x, startValue, endValue, endPosition);
			throttledOnValueChange(v);
		},
		[throttledOnValueChange, startValue, endValue, endPosition],
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

				// snap to start
				if (pan.x._value < 0) {
					Animated.spring(pan, {
						toValue: { x: 0, y: 0 },
						useNativeDriver: false,
						speed: 1000,
					}).start(() => {
						active.current = false;
					});
				}

				// snap to max
				if (pan.x._value > maxEndPosition) {
					Animated.spring(pan, {
						toValue: { x: maxEndPosition, y: 0 },
						useNativeDriver: false,
						speed: 1000,
					}).start(() => {
						active.current = false;
					});
				}

				// handle snapPoint
				if (snapPoint !== undefined) {
					const delta = endValue - startValue;
					const snapPointX = (endPosition / delta) * snapPoint;

					if (pan.x._value < snapPointX * 0.65) {
						Animated.spring(pan, {
							toValue: { x: 0, y: 0 },
							useNativeDriver: false,
							overshootClamping: true,
						}).start(() => {
							pan.setValue({ x: 0, y: pan.y._value });
							active.current = false;
						});
					}

					if (pan.x._value < snapPointX && pan.x._value >= snapPointX * 0.65) {
						Animated.spring(pan, {
							toValue: { x: snapPointX, y: 0 },
							useNativeDriver: false,
							overshootClamping: true,
						}).start(() => {
							pan.setValue({ x: snapPointX, y: pan.y._value });
							active.current = false;
						});
					}
				}
			},
		});
	}, [endPosition, maxEndPosition, pan, snapPoint, startValue, endValue]);

	const circleTranslateX = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [0, endPosition],
	});

	let snapPointTranslateX: number | undefined;
	if (containerWidth > 0 && snapPoint !== undefined) {
		snapPointTranslateX =
			SNAP_POINT_SIZE / 2 +
			((containerWidth - SNAP_POINT_SIZE * 2) / endValue - startValue) *
				snapPoint;
	}

	const minTrackWidth = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [CIRCLE_SIZE / 2, endPosition + CIRCLE_SIZE / 2],
	});

	const maxTrackWidth = pan.x.interpolate({
		inputRange: [0, maxEndPosition],
		outputRange: [maxEndPosition + CIRCLE_SIZE / 2, CIRCLE_SIZE / 2],
	});

	const disabledTrackWidth = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [endPosition + CIRCLE_SIZE / 2, CIRCLE_SIZE / 2],
	});

	useEffect(() => {
		const l = pan.addListener(({ x }: { x: number }) => handleValueChange(x));
		return () => pan.removeListener(l);
	}, [pan, handleValueChange]);

	useEffect(() => {
		if (active.current) {
			return;
		}
		const x = valueToX(value, startValue, endValue, endPosition);
		pan.setValue({ x, y: pan.y._value });
	}, [pan, value, startValue, endValue, endPosition]);

	return (
		<View style={styles.root}>
			<View
				style={styles.container}
				onLayout={(e): void => {
					const ww = e.nativeEvent.layout.width;
					setContainerWidth((w) => (w === 0 ? ww : w));
				}}>
				<Animated.View
					style={[
						styles.track,
						styles.minTrack,
						{
							backgroundColor: minTrackColor,
							width: minTrackWidth,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.track,
						styles.disabledTrack,
						{
							backgroundColor: disabledTrackColor,
							width: disabledTrackWidth,
						},
					]}
				/>
				<Animated.View
					style={[
						styles.track,
						{
							backgroundColor: maxTrackColor,
							width: maxTrackWidth,
							left: minTrackWidth,
						},
					]}
				/>
				{snapPointTranslateX !== undefined ? (
					<Animated.View
						style={[
							styles.snapPoint,
							{ transform: [{ translateX: snapPointTranslateX }] },
						]}>
						<ThemedView color="white" style={styles.snapPoint} />
					</Animated.View>
				) : null}
				<Animated.View
					style={[
						styles.grab,
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
					testID="SliderHandle"
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
	track: {
		borderRadius: 8,
		flexDirection: 'row',
		height: 8,
		flex: 1,
		position: 'absolute',
		bottom: 0,
		top: 12,
	},
	minTrack: {
		left: 0,
	},
	disabledTrack: {
		right: 0,
	},
	grab: {
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
	snapPoint: {
		borderRadius: 5,
		position: 'absolute',
		left: 0,
		height: 16,
		width: SNAP_POINT_SIZE,
	},
});

export default memo(FancySlider);
