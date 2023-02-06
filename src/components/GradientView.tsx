import React, { memo, ReactElement, ReactNode } from 'react';
import { Image, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { View as ThemedView } from '../styles/components';

const imageSrc = require('../assets/bottom-sheet-bg.png');

const GradientView = ({
	style,
	children,
}: {
	style?: StyleProp<ViewStyle>;
	children?: ReactNode;
}): ReactElement => {
	return (
		<ThemedView style={[styles.root, style]}>
			<Image style={styles.background} source={imageSrc} />
			{children}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		position: 'relative',
	},
	background: {
		resizeMode: 'stretch',
		position: 'absolute',
		top: 0,
		left: '-2%',
		bottom: '15%',
		width: '105%',
		height: undefined,
	},
});

export default memo(GradientView);
