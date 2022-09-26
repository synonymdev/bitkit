import React, { memo, ReactElement } from 'react';
import { Alert, StyleSheet } from 'react-native';

import {
	PlusIcon,
	Subtitle,
	Text01M,
	TouchableOpacity,
	View,
} from '../styles/components';
import BitfinexWidget from './BitfinexWidget';

const Widgets = (): ReactElement => {
	return (
		<>
			<Subtitle style={styles.content}>Widgets</Subtitle>
			<View>
				<BitfinexWidget />
				<TouchableOpacity
					onPress={(): void => Alert.alert('TODO')}
					style={styles.add}>
					<View color="green16" style={styles.iconCircle}>
						<PlusIcon height={13} color="green" />
					</View>
					<Text01M>Add Widget</Text01M>
				</TouchableOpacity>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	content: {
		marginTop: 32,
		marginBottom: 8,
	},
	add: {
		height: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	iconCircle: {
		borderRadius: 20,
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
});

export default memo(Widgets);
