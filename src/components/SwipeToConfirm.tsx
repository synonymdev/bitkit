import React, { ReactElement, memo, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../styles/components';
import { Text02M } from '../styles/text';
import { RightArrow } from '../styles/icons';
import { IThemeColors } from '../styles/themes';
import useColors from '../hooks/colors';
import LoadingSpinner from './Spinner';

import Animated, {
	runOnJS,
	useAnimatedGestureHandler,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

const CIRCLE_SIZE = 60;
const GRAB_SIZE = 120;
const INVISIBLE_BORDER = (GRAB_SIZE - CIRCLE_SIZE) / 2;
const PADDING = 8;

interface ISwipeToConfirm {
	text?: string;
	color?: keyof IThemeColors;
	onConfirm?: () => void;
	icon?: ReactElement;
	loading?: boolean;
	confirmed: boolean;
	style?: StyleProp<ViewStyle>;
}

const SwipeToConfirm = ({
	text,
	color,
	onConfirm,
	icon,
	loading,
	confirmed,
	style,
}: ISwipeToConfirm): ReactElement => {
	const { t } = useTranslation('other');
	text = text ?? t('swipe');
	const colors = useColors();
	const circleColor = color ? colors[color] : colors.green ?? colors.green;
	const [containerWidth, setContainerWidth] = useState(0);
	const endPosition = containerWidth === 0 ? 1 : containerWidth - CIRCLE_SIZE;

	const panX = useSharedValue(0);
	const loadingOpacity = useSharedValue(loading ? 1 : 0);

	const panGestureHandler = useAnimatedGestureHandler({
		onStart: (_, ctx) => {
			// @ts-ignore
			ctx.offsetX = panX.value;
		},
		onActive: (event, ctx) => {
			// @ts-ignore
			panX.value = ctx.offsetX + event.translationX;
		},
		onEnd: (_) => {
			const finished = panX.value > endPosition * 0.8;
			panX.value = withSpring(finished ? endPosition : 0);

			if (finished) {
				// @ts-ignore
				runOnJS(onConfirm)?.();
			}
		},
	});

	// Animated styles
	const circleTranslateXStyle = useAnimatedStyle(() => {
		const translateX = panX.value;
		return { transform: [{ translateX }] };
	});

	const textOpacityStyle = useAnimatedStyle(() => {
		const opacity = 1 - panX.value / endPosition;
		return { opacity };
	});

	const startIconOpacityStyle = useAnimatedStyle(() => {
		const opacity = 1 - panX.value / (endPosition / 2);
		return { opacity };
	});

	// hide if loading is visible
	const endIconOpacityStyle = useAnimatedStyle(() => {
		const opacity =
			(panX.value - endPosition / 2) / (endPosition / 2) - loadingOpacity.value;
		return { opacity };
	});

	const loadingIconOpacityStyle = useAnimatedStyle(() => {
		return { opacity: loadingOpacity.value };
	});

	useEffect(() => {
		loadingOpacity.value = withTiming(loading ? 1 : 0, {
			duration: 300,
		});
	}, [loading, loadingOpacity]);

	useEffect(() => {
		panX.value = withTiming(confirmed ? endPosition : 0);
	}, [confirmed, endPosition, panX]);

	return (
		<ThemedView color="white16" style={[styles.root, style]}>
			<View
				style={styles.container}
				onLayout={(e): void => {
					const ww = e.nativeEvent.layout.width;
					setContainerWidth((w) => (w === 0 ? ww : w));
				}}>
				<Animated.View style={textOpacityStyle}>
					<Text02M>{text}</Text02M>
				</Animated.View>
				<PanGestureHandler onGestureEvent={panGestureHandler}>
					<Animated.View
						style={[
							styles.grab,
							{
								height: GRAB_SIZE,
								width: GRAB_SIZE,
							},
							circleTranslateXStyle,
						]}
						testID="GRAB">
						<Animated.View
							style={[styles.circle, { backgroundColor: circleColor }]}>
							<Animated.View style={[styles.icon, startIconOpacityStyle]}>
								<RightArrow color="black" />
							</Animated.View>
							<Animated.View style={[styles.icon, endIconOpacityStyle]}>
								{icon}
							</Animated.View>
							<Animated.View style={[styles.icon, loadingIconOpacityStyle]}>
								<LoadingSpinner size={34} />
							</Animated.View>
						</Animated.View>
					</Animated.View>
				</PanGestureHandler>
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
