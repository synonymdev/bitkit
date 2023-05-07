import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { View as ThemedView } from '../styles/components';
import { Caption13M } from '../styles/text';

const BOX_SIZE = 32;

const Tooltip = ({
	style,
	text,
	testID,
}: {
	text: string | ReactElement;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}): ReactElement => {
	return (
		<View style={[styles.root, style]} testID={testID}>
			<View style={styles.boxContainer}>
				<ThemedView color="black92" style={styles.box} />
			</View>
			<ThemedView color="black92" style={styles.content}>
				<Caption13M>{text}</Caption13M>
			</ThemedView>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		position: 'relative',
	},
	boxContainer: {
		height: BOX_SIZE / 2,
		alignItems: 'center',
	},
	box: {
		height: BOX_SIZE,
		width: BOX_SIZE,
		transform: [{ rotate: '45deg' }],
		marginTop: 5,
	},
	content: {
		borderRadius: 8,
		paddingVertical: 24,
		paddingHorizontal: 32,
	},
});

export default memo(Tooltip);
