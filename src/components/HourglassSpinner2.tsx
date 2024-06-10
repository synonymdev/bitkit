import React, { ReactElement } from 'react';
import { StyleSheet, StyleProp, ViewStyle, Image } from 'react-native';
import { withRepeat, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '../styles/components';
import { __E2E__ } from '../constants/env';

const imageSrc = require('../assets/illustrations/hourglass.png');

const HourglassSpinner = ({
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
			entering={__E2E__ ? undefined : entering}
			color="transparent"
			testID="HourglassSpinner">
			<Image style={styles.image} source={imageSrc} />
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		height: 300,
		resizeMode: 'contain',
	},
});

export default HourglassSpinner;
