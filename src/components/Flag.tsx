import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { Caption13Up, View } from '../styles/components';

const FLAG_HEIGHT = 26;

const Flag = ({
	style,
	text,
}: {
	style?: object;
	text: string;
}): ReactElement => {
	return (
		<View style={[styles.root, style]} color="transparent">
			<View color="brand" style={[styles.box, styles.box3]} />
			<View style={styles.row} color="transparent">
				<View color="brand" style={[styles.box, styles.box1]} />
				<View color="brand" style={[styles.box, styles.box2]} />
				<View color="brand" style={styles.text}>
					<Caption13Up>{text}</Caption13Up>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		height: FLAG_HEIGHT * 1.5,
		overflow: 'hidden',
	},
	row: {
		height: FLAG_HEIGHT,
		overflow: 'hidden',
		paddingLeft: FLAG_HEIGHT / 2,
		position: 'relative',
	},
	box: {
		height: FLAG_HEIGHT,
		width: FLAG_HEIGHT,
		position: 'absolute',
	},
	box1: {
		transform: [{ skewY: '45deg' }],
		top: -FLAG_HEIGHT / 2,
	},
	box2: {
		transform: [{ skewY: '-45deg' }],
		top: +FLAG_HEIGHT / 2,
	},
	box3: {
		transform: [{ skewY: '45deg' }],
		right: -FLAG_HEIGHT / 2,
		top: FLAG_HEIGHT / 2,
		opacity: 0.5,
	},
	text: {
		height: FLAG_HEIGHT,
		paddingLeft: 6,
		paddingRight: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(Flag);
