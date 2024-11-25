import React, { ReactElement } from 'react';
import {
	View,
	StyleSheet,
	StyleProp,
	ViewStyle,
	Image,
	ImageSourcePropType,
} from 'react-native';
import { Easing, withRepeat, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '../styles/components';
import { __E2E__ } from '../constants/env';

const imageSrc = require('../assets/illustrations/hourglass.png');

const HourglassSpinner = ({
	image = imageSrc,
	imageSize = 256,
	style,
}: {
	image?: ImageSourcePropType;
	imageSize?: number;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const entering = (): { initialValues: {}; animations: {} } => {
		'worklet';
		const initialValues = {
			transform: [{ rotate: '-16deg' }],
		};
		const animations = {
			transform: [
				{
					rotate: withRepeat(
						withTiming('16deg', {
							duration: 3000,
							easing: Easing.inOut(Easing.ease),
						}),
						-1,
						true,
					),
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
			<View style={[styles.imageContainer, { width: imageSize }]}>
				<Image style={styles.image} source={image} />
			</View>
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		aspectRatio: 1,
		marginHorizontal: 16,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
});

export default HourglassSpinner;
