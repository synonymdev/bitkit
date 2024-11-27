import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	clamp,
	interpolate,
	runOnJS,
} from 'react-native-reanimated';

import { Text13UP } from '../styles/text';
import { View as ThemedView } from '../styles/components';
import useColors from '../hooks/colors';

const KNOB_SIZE = 32;

const Slider = ({
	steps,
	value,
	onValueChange,
}: {
	steps: number[];
	value: number;
	onValueChange: (value: number) => void;
}): ReactElement => {
	const colors = useColors();
	const [sliderWidth, setSliderWidth] = useState(0);
	const panX = useSharedValue(0);
	const prevPanX = useSharedValue(0);

	// Convert steps to evenly spaced positions on the slider
	const stepPositions = useMemo(() => {
		return steps.map((_, index) => {
			const numSteps = steps.length - 1;
			// Calculate position based on index, using full width
			return (index / numSteps) * sliderWidth;
		});
	}, [steps, sliderWidth]);

	// Set initial position when slider width changes or value changes
	useEffect(() => {
		if (sliderWidth === 0) {
			return;
		}

		// Find index of current value in steps array
		const valueIndex = steps.indexOf(value);
		panX.value = stepPositions[valueIndex];
	}, [sliderWidth, value, steps, stepPositions, panX]);

	const findClosestStep = (currentPosition: number): number => {
		'worklet';
		return stepPositions.reduce((closestStep, currentStep) => {
			// Calculate the difference between the current step and the current position
			const currentDifference = Math.abs(currentStep - currentPosition);
			const closestDifference = Math.abs(closestStep - currentPosition);

			// If the current step is closer, update the closest step
			return currentDifference < closestDifference ? currentStep : closestStep;
		});
	};

	const tapGesture = Gesture.Tap().onStart((event) => {
		const closestStep = findClosestStep(event.x);
		panX.value = closestStep;

		if (onValueChange) {
			const stepIndex = stepPositions.indexOf(closestStep);
			runOnJS(onValueChange)(steps[stepIndex]);
		}
	});

	const panGesture = Gesture.Pan()
		.onStart(() => {
			prevPanX.value = panX.value;
		})
		.onUpdate((event) => {
			panX.value = clamp(prevPanX.value + event.translationX, 0, sliderWidth);
		})
		.onEnd(() => {
			const closestStep = findClosestStep(panX.value);
			panX.value = withSpring(closestStep);

			if (onValueChange) {
				const stepIndex = stepPositions.indexOf(closestStep);
				runOnJS(onValueChange)(steps[stepIndex]);
			}
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: panX.value - KNOB_SIZE / 2 }],
	}));

	const trailStyle = useAnimatedStyle(() => ({
		width: interpolate(panX.value, [0, sliderWidth], [0, sliderWidth]),
		backgroundColor: colors.green,
	}));

	return (
		<View
			style={styles.container}
			onLayout={(e): void => setSliderWidth(e.nativeEvent.layout.width)}>
			<View style={styles.sliderContainer}>
				<GestureDetector gesture={tapGesture}>
					<View style={styles.trackHitbox}>
						<ThemedView style={styles.track} color="green32" />
						<Animated.View style={[styles.track, trailStyle]} />
						{stepPositions.map((pos, index) => (
							<View
								key={`step-${index}`}
								style={[styles.stepContainer, { left: pos - 2 }]}>
								<ThemedView style={styles.stepMarker} color="white" />
								<Text13UP style={styles.stepLabel} numberOfLines={1}>
									${steps[index]}
								</Text13UP>
							</View>
						))}
					</View>
				</GestureDetector>
				<GestureDetector gesture={panGesture}>
					<Animated.View style={[styles.knob, animatedStyle]}>
						<ThemedView style={styles.knobOuter} color="green">
							<ThemedView style={styles.knobInner} color="white" />
						</ThemedView>
					</Animated.View>
				</GestureDetector>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: 16,
		flex: 1,
	},
	sliderContainer: {
		height: KNOB_SIZE,
		flexDirection: 'row',
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
	},
	trackHitbox: {
		justifyContent: 'center',
		height: 30,
		width: '100%',
	},
	track: {
		borderRadius: 3,
		height: 8,
		width: '100%',
		position: 'absolute',
		left: 0,
	},
	stepContainer: {
		position: 'absolute',
		alignItems: 'center',
		height: '100%',
		justifyContent: 'center',
	},
	stepMarker: {
		width: 4,
		height: 16,
		borderRadius: 5,
	},
	stepLabel: {
		position: 'absolute',
		top: '100%',
		marginTop: 4,
		width: 30,
		textAlign: 'center',
	},
	knob: {
		width: KNOB_SIZE,
		height: KNOB_SIZE,
		borderRadius: KNOB_SIZE / 2,
		position: 'absolute',
		left: 0,
	},
	knobOuter: {
		borderRadius: KNOB_SIZE,
		height: KNOB_SIZE,
		width: KNOB_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	knobInner: {
		borderRadius: 16,
		height: 16,
		width: 16,
	},
});

export default Slider;
