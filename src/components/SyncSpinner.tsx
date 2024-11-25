import React, { ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
	Easing,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

import { __E2E__ } from '../constants/env';

const imageSyncSmall = require('../assets/illustrations/ln-sync-small.png');
const imageSyncLarge = require('../assets/illustrations/ln-sync-large.png');

const easing = Easing.inOut(Easing.ease);
const duration = 1500;

type TKeyframe = { initialValues: {}; animations: {} };

const clockwiseAnimation = (): TKeyframe => {
	'worklet';
	const initialValues = { transform: [{ rotate: '0deg' }] };
	const animations = {
		transform: [
			{
				rotate: withRepeat(
					withSequence(
						withTiming('180deg', { duration, easing }),
						withDelay(100, withTiming('360deg', { duration, easing })),
					),
					-1,
				),
			},
		],
	};

	return { initialValues, animations };
};

const counterClockwiseAnimation = (): TKeyframe => {
	'worklet';
	const initialValues = { transform: [{ rotate: '0deg' }] };
	const animations = {
		transform: [
			{
				rotate: withRepeat(
					withSequence(
						withTiming('-180deg', { duration, easing }),
						withDelay(100, withTiming('-360deg', { duration, easing })),
					),
					-1,
				),
			},
		],
	};

	return { initialValues, animations };
};

const SyncSpinner = ({
	style,
}: {
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	return (
		<View style={[styles.root, style]}>
			<Animated.Image
				style={styles.circle}
				source={imageSyncSmall}
				entering={__E2E__ ? undefined : clockwiseAnimation}
			/>
			<Animated.Image
				style={[styles.circle, styles.circleLarge]}
				source={imageSyncLarge}
				entering={__E2E__ ? undefined : counterClockwiseAnimation}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		position: 'absolute',
		width: 311,
		aspectRatio: 1,
	},
	circle: {
		flex: 1,
		position: 'absolute',
		resizeMode: 'contain',
		width: 207,
		aspectRatio: 1,
	},
	circleLarge: {
		width: 311,
	},
});

export default SyncSpinner;
