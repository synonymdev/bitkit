import React, { memo, ReactElement, ReactNode } from 'react';
import {
	ImageBackground,
	ImageSourcePropType,
	StyleProp,
	StyleSheet,
	ViewStyle,
} from 'react-native';

const imageSrc = require('../assets/bottom-sheet-bg.png');

const GradientView = ({
	style,
	image = imageSrc,
	children,
}: {
	style?: StyleProp<ViewStyle>;
	image?: ImageSourcePropType;
	children?: ReactNode;
}): ReactElement => (
	<ImageBackground style={[styles.root, style]} source={image}>
		{children}
	</ImageBackground>
);

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
});

export default memo(GradientView);
