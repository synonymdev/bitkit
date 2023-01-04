import React, {
	ReactElement,
	memo,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	ActivityIndicator,
	Animated,
	PanResponder,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';

import { View as ThemedView } from '../styles/components';
import { Text02M } from '../styles/text';
import { RightArrow } from '../styles/icons';
import useColors from '../hooks/colors';

const CIRCLE_SIZE = 60;
const GRAB_SIZE = 120;
const INVISIBLE_BORDER = (GRAB_SIZE - CIRCLE_SIZE) / 2;
const PADDING = 8;

interface ISwipeToConfirm {
	text?: string;
	color?: string;
	onConfirm?: Function;
	icon?: ReactElement;
	loading?: boolean;
	confirmed: boolean;
	style?: StyleProp<ViewStyle>;
}
const SwipeToConfirm = ({
	text = 'Swipe To Confirm',
	color,
	onConfirm,
	icon,
	loading,
	confirmed,
	style,
}: ISwipeToConfirm): ReactElement => {
	const pan = useRef<any>(new Animated.ValueXY()).current;
	const loadingOpacity = useRef(new Animated.Value(0)).current;
	const colors = useColors();
	const kolor = color ? colors[color] : colors.green ?? colors.green;
	const confirmedInternal = useRef(false);
	const [containerWidth, setContainerWidth] = useState(0);
	const endPosition = containerWidth === 0 ? 1 : containerWidth - CIRCLE_SIZE;

	const panResponder = useMemo(() => {
		// wait for containerWidth to be set
		if (endPosition === 1) {
			return { panHandlers: {} };
		}

		return PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => !confirmedInternal.current,
			onPanResponderGrant: () => {
				pan.setOffset({
					x: pan.x._value,
					y: pan.y._value,
				});
			},
			onPanResponderMove: Animated.event([null, { dx: pan.x }], {
				useNativeDriver: false,
			}),
			onPanResponderRelease: () => {
				pan.flattenOffset();
				const finished = pan.x._value > endPosition * 0.8;
				Animated.spring(pan, {
					toValue: { x: finished ? endPosition : 0, y: 0 },
					useNativeDriver: false,
				}).start(() => {
					if (finished) {
						confirmedInternal.current = true;
						onConfirm?.();
					}
				});
			},
		});
	}, [endPosition, pan, onConfirm]);

	const circleTranslateX = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [0, endPosition],
	});

	const shadowOpacity = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [0, 0.16],
	});

	const shadowWidth = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [CIRCLE_SIZE / 2, endPosition + CIRCLE_SIZE / 2],
	});

	const textOpacity = pan.x.interpolate({
		inputRange: [0, endPosition],
		outputRange: [1, 0],
	});

	const startIconOpacity = pan.x.interpolate({
		inputRange: [0, endPosition / 2],
		outputRange: [1, 0],
	});

	// hide if loading is visible
	const endIconOpacity = Animated.subtract(
		pan.x.interpolate({
			inputRange: [endPosition / 2, endPosition],
			outputRange: [0, 1],
		}),
		loadingOpacity,
	);

	useEffect(() => {
		Animated.timing(loadingOpacity, {
			toValue: loading ? 1 : 0,
			delay: loading ? 1 : 0,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [loading, loadingOpacity]);

	useEffect(() => {
		Animated.spring(pan, {
			toValue: { x: confirmed ? endPosition : 0, y: 0 },
			useNativeDriver: false,
		}).start();
		confirmedInternal.current = confirmed;
	}, [confirmed, endPosition, pan]);

	return (
		<ThemedView color="white08" style={[styles.root, style]}>
			<View
				style={styles.container}
				onLayout={(e): void => {
					const ww = e.nativeEvent.layout.width;
					setContainerWidth((w) => (w === 0 ? ww : w));
				}}>
				<Animated.View
					style={[
						styles.shadow,
						{
							backgroundColor: kolor,
							width: shadowWidth,
							opacity: shadowOpacity,
						},
					]}
				/>
				<Animated.View style={{ opacity: textOpacity }}>
					<Text02M>{text}</Text02M>
				</Animated.View>
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
					{...panResponder.panHandlers}>
					<Animated.View style={[styles.circle, { backgroundColor: kolor }]}>
						<Animated.View style={[styles.icon, { opacity: startIconOpacity }]}>
							<RightArrow color="black" />
						</Animated.View>
						<Animated.View style={[styles.icon, { opacity: endIconOpacity }]}>
							{icon}
						</Animated.View>
						<Animated.View style={[styles.icon, { opacity: loadingOpacity }]}>
							<ActivityIndicator color="black" />
						</Animated.View>
					</Animated.View>
				</Animated.View>
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		borderRadius: CIRCLE_SIZE,
		height: CIRCLE_SIZE + PADDING * 2,
		flexDirection: 'row',
		padding: PADDING,
	},
	container: {
		flexDirection: 'row',
		flex: 1,
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
	},
	shadow: {
		flexDirection: 'row',
		height: CIRCLE_SIZE,
		borderTopLeftRadius: CIRCLE_SIZE,
		borderBottomLeftRadius: CIRCLE_SIZE,
		flex: 1,
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
	},
	grab: {
		position: 'absolute',
		left: -INVISIBLE_BORDER,
		top: -INVISIBLE_BORDER,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circle: {
		height: CIRCLE_SIZE,
		width: CIRCLE_SIZE,
		borderRadius: CIRCLE_SIZE,
	},
	icon: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(SwipeToConfirm);
