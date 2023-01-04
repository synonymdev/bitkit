import React from 'react';
import { StyleSheet, View } from 'react-native';

import { EvilIcon } from '../../styles/icons';

interface Props {
	direction: 'up' | 'down';
}

const iconSize = 40;

const AnimatedDragIcon: React.FC<Props> = ({ direction }) => {
	return (
		<View style={styles.iconContainer}>
			{direction === 'up' ? (
				<EvilIcon name={'chevron-up'} size={iconSize} color="onBackground" />
			) : (
				<EvilIcon name={'chevron-down'} size={iconSize} color="onBackground" />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	iconContainer: {
		height: 60,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		alignContent: 'center',
	},
});

export default AnimatedDragIcon;
