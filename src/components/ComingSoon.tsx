import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { Caption13Up, View } from '../styles/components';

const HEIGHT = 26;

const ComingSoon = ({ style }: { style?: object }): ReactElement => {
	return (
		<View style={[styles.root, style]} color="transparent">
			<View color="brand" style={[styles.box, styles.box3]} />
			<View style={styles.row} color="transparent">
				<View color="brand" style={[styles.box, styles.box1]} />
				<View color="brand" style={[styles.box, styles.box2]} />
				<View color="brand" style={styles.text}>
					<Caption13Up>COMING SOON</Caption13Up>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		height: HEIGHT * 1.5,
		overflow: 'hidden',
	},
	row: {
		height: HEIGHT,
		overflow: 'hidden',
		paddingLeft: HEIGHT / 2,
		position: 'relative',
	},
	box: {
		height: HEIGHT,
		width: HEIGHT,
		position: 'absolute',
	},
	box1: {
		transform: [{ skewY: '45deg' }],
		top: -HEIGHT / 2,
	},
	box2: {
		transform: [{ skewY: '-45deg' }],
		top: +HEIGHT / 2,
	},
	box3: {
		transform: [{ skewY: '45deg' }],
		right: -HEIGHT / 2,
		top: HEIGHT / 2,
		opacity: 0.5,
	},
	text: {
		height: HEIGHT,
		paddingLeft: 6,
		paddingRight: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(ComingSoon);
