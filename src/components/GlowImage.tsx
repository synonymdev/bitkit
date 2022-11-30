import React, { ReactElement } from 'react';
import {
	View,
	StyleSheet,
	Image,
	StyleProp,
	ViewStyle,
	ImageSourcePropType,
} from 'react-native';

import { IColors } from '../styles/colors';
import Glow from './Glow';

export const GlowImage = ({
	image,
	imageSize = 220,
	glowColor = 'brand',
	style,
}: {
	image: ImageSourcePropType;
	imageSize?: number;
	glowColor?: keyof IColors;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	return (
		<View style={[styles.container, style]} pointerEvents="none">
			<Glow color={glowColor} size={600} style={styles.glow} />
			<Image source={image} style={[styles.image, { height: imageSize }]} />
		</View>
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
		resizeMode: 'contain',
	},
});

export default GlowImage;
