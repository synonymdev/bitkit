import React, { ReactElement } from 'react';
import { StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';
import { withRepeat, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '../styles/components';
import Glow from './Glow';

const imageSrc = require('../assets/illustrations/hourglass.png');

export const HourglassSpinner = ({
	style,
}: {
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const entering = (): { initialValues: {}; animations: {} } => {
		'worklet';
		const initialValues = {
			transform: [{ rotate: '-10deg' }],
		};
		const animations = {
			transform: [
				{
					rotate: withRepeat(withTiming('40deg', { duration: 3000 }), -1, true),
				},
			],
		};

		return {
			initialValues,
			animations,
		};
	};

	return (
		<AnimatedView
			entering={entering}
			style={[styles.container, style]}
			color="transparent"
			pointerEvents="none">
			<Glow color="brand" size={600} style={styles.glow} />
			<Image source={imageSrc} style={styles.image} />
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	glow: {
		position: 'absolute',
	},
	image: {
		width: 230,
		height: 230,
	},
});

export default HourglassSpinner;
