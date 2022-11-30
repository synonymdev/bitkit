import React, { ReactElement } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { withRepeat, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '../styles/components';
import GlowImage from './GlowImage';

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
			style={[styles.container, style]}
			entering={entering}
			color="transparent">
			<GlowImage image={imageSrc} imageSize={230} />
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default HourglassSpinner;
