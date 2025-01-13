import React, { memo, ReactElement, ReactNode } from 'react';
import {
	Image,
	ImageSourcePropType,
	StyleProp,
	StyleSheet,
	View,
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
	<View style={[styles.root, style]}>
		<Image style={styles.background} source={image} />
		{children}
	</View>
);

const styles = StyleSheet.create({
	root: {
		flex: 1,
		position: 'relative',
	},
	background: {
		position: 'absolute',
		resizeMode: 'stretch',
		top: 0,
		bottom: 0,
		width: '100%',
		height: undefined,
	},
});

export default memo(GradientView);
