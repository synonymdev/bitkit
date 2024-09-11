import React, { ReactElement, memo, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

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
    confirmed?: boolean; // if true, the circle will be at the end
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

    // Track swipe position
    const panX = useSharedValue(0);

    // Ensure swiperWidth is correctly set
    const handleLayout = (event) => {
        const { width } = event.nativeEvent.layout;
        setSwiperWidth(width > 0 ? width : 1); // Prevent swiperWidth from being set to 0
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: clamp(panX.value, 0, maxPanX) }],
    }));

    // Disable swipe when loading or confirmed
    useEffect(() => {
        if (loading || confirmed) {
            panX.value = withTiming(0); // Reset position when blocked
        }
    }, [loading, confirmed]);

    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            if (!loading && !confirmed) {
                panX.value = clamp(event.translationX, 0, maxPanX);
            }
        })
        .onEnd(() => {
            if (panX.value >= maxPanX) {
                runOnJS(onConfirm)();
            } else {
                panX.value = withSpring(0); // Reset to starting position if swipe is incomplete
            }
        });

    return (
        <GestureDetector gesture={gesture}>
            <ThemedView onLayout={handleLayout} style={[styles.container, style]}>
                {/* Swipe elements and UI */}
                <Animated.View style={[styles.circle, animatedStyle]}>
                    {loading ? <LoadingSpinner /> : <RightArrow />}
                </Animated.View>
            </ThemedView>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        // Styles for the swipe container
    },
    circle: {
        // Styles for the swipe circle
    },
});

export default memo(SwipeToConfirm);
