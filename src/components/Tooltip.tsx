import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, TouchableOpacityProps, View } from 'react-native';
import { Caption13M, View as ThemedView } from '../styles/components';

const BOX_SIZE = 32;

interface ITooltip extends TouchableOpacityProps {
	text: string | ReactElement;
	style?: object | Array<object>;
}
const Tooltip = ({ style, text = '' }: ITooltip): ReactElement => {
	const rootStyle = useMemo(
		() => StyleSheet.compose(styles.root, style),
		[style],
	);

	return (
		<View style={rootStyle}>
			<View style={styles.boxContainer}>
				<ThemedView color="black92" style={styles.box} />
			</View>
			<ThemedView color="black92" style={styles.content}>
				<Caption13M color="brand">{text}</Caption13M>
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
		paddingVertical: 24,
		paddingHorizontal: 32,
	},
});

export default memo(Tooltip);
