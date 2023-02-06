import React, { memo, ReactElement } from 'react';
import { Image, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { View as ThemedView } from '../styles/components';

const imageSrc = require('../assets/bottom-sheet-bg.png');

const BottomSheetBackground = ({
	style,
}: {
	style: StyleProp<ViewStyle>;
}): ReactElement => (
	<ThemedView style={[styles.root, style]}>
		<ThemedView style={styles.handleBackground} color="gray6" />
		<Image style={styles.background} source={imageSrc} />
	</ThemedView>
);

const styles = StyleSheet.create({
	root: {
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		overflow: 'hidden',
		position: 'relative',
	},
	handleBackground: {
		height: 32,
	},
	background: {
		resizeMode: 'stretch',
		position: 'absolute',
		top: 32,
		left: '-2%',
		bottom: '60%',
		width: '105%',
		height: undefined,
	},
});

export default memo(BottomSheetBackground);
