import React, { ReactElement } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { withRepeat, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '../styles/components';
import GlowImage from './GlowImage';
import { IColors } from '../styles/colors';
import { __E2E__ } from '../constants/env';

const imageSrc = require('../assets/illustrations/hourglass.png');

const HourglassSpinner = ({
	glowColor,
	style,
}: {
	glowColor?: keyof IColors;
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
			entering={__E2E__ ? undefined : entering}
			color="transparent"
			testID="HourglassSpinner">
			<GlowImage image={imageSrc} imageSize={230} glowColor={glowColor} />
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
