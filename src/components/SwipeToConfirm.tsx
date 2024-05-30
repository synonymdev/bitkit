import React, { ReactElement, memo, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	clamp,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import { View as ThemedView } from '../styles/components';
import { BodySSB } from '../styles/text';
import { RightArrow } from '../styles/icons';
import { IThemeColors } from '../styles/themes';
import useColors from '../hooks/colors';
import LoadingSpinner from './Spinner';

const CIRCLE_SIZE = 60;
const GRAB_SIZE = 120;
const INVISIBLE_BORDER = (GRAB_SIZE - CIRCLE_SIZE) / 2;
const PADDING = 8;

interface ISwipeToConfirm {
	text?: string;
	color?: keyof IThemeColors;
	icon?: ReactElement;
	loading?: boolean;
	confirmed: boolean;
	style?: StyleProp<ViewStyle>;
	onConfirm: () => void;
}

const SwipeToConfirm = ({
	text,
	color,
	icon,
	loading,
	confirmed,
	style,
	onConfirm,
}: ISwipeToConfirm): ReactElement => {
	const { t } = useTranslation('other');
	text = text ?? t('swipe');
	const colors = useColors();
	const trailColor = color ? `${colors[color]}24` : colors.green24;
	const circleColor = color ? colors[color] : colors.green;
	const [swiperWidth, setSwiperWidth] = useState(0);
	const maxPanX = swiperWidth === 0 ? 1 : swiperWidth - CIRCLE_SIZE;

	const panX = useSharedValue(0);
	const prevPanX = useSharedValue(0);
	const loadingOpacity = useSharedValue(loading ? 1 : 0);

	const panGesture = Gesture.Pan()
		.onStart(() => {
			prevPanX.value = panX.value;
		})
		.onUpdate((event) => {
			panX.value = clamp(prevPanX.value + event.translationX, 0, maxPanX);
		})
		.onEnd(() => {
			const swiped = panX.value > maxPanX * 0.8;
			panX.value = withSpring(swiped ? maxPanX : 0);

			if (swiped) {
				runOnJS(onConfirm)();
			}
		});

	// Animated styles
	const trailStyle = useAnimatedStyle(() => {
		const width = panX.value + CIRCLE_SIZE;
		return { width };
	});

	const circleStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: panX.value }],
	}));

	const textOpacityStyle = useAnimatedStyle(() => {
		const opacity = 1 - panX.value / maxPanX;
		return { opacity };
	});

	const startIconOpacityStyle = useAnimatedStyle(() => {
		const opacity = 1 - panX.value / (maxPanX / 2);
		return { opacity };
	});

	// hide if loading is visible
	const endIconOpacityStyle = useAnimatedStyle(() => {
		const opacity =
			(panX.value - maxPanX / 2) / (maxPanX / 2) - loadingOpacity.value;
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
		panX.value = withTiming(confirmed ? maxPanX : 0);
	}, [confirmed, maxPanX, panX]);

	return (
		<ThemedView color="white16" style={[styles.root, style]}>
			<View
				style={styles.container}
				onLayout={(e): void => {
					const ww = e.nativeEvent.layout.width;
					setSwiperWidth((w) => (w === 0 ? ww : w));
				}}>
				<Animated.View
					style={[styles.trail, { backgroundColor: trailColor }, trailStyle]}
				/>
				<Animated.View style={textOpacityStyle}>
					<BodySSB>{text}</BodySSB>
				</Animated.View>
				<GestureDetector gesture={panGesture}>
					<Animated.View style={[styles.grab, circleStyle]} testID="GRAB">
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
				</GestureDetector>
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
	trail: {
		borderRadius: CIRCLE_SIZE,
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		width: '100%',
	},
	grab: {
		position: 'absolute',
		left: -INVISIBLE_BORDER,
		top: -INVISIBLE_BORDER,
		alignItems: 'center',
		justifyContent: 'center',
		height: GRAB_SIZE,
		width: GRAB_SIZE,
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
