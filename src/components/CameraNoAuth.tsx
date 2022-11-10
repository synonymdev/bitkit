import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { systemWeights } from 'react-native-typography';

import { EvilIcon, Text, View } from '../styles/components';
import NavigationHeader from './NavigationHeader';
import SafeAreaView from './SafeAreaView';

const CameraNoAuth = (): ReactElement => {
	return (
		<SafeAreaView style={styles.root}>
			<NavigationHeader title="Permission" />
			<View style={styles.container} color="transparent">
				<EvilIcon name="exclamation" size={60} />
				<Text style={styles.boldText}>
					It appears Bitkit does not have permission to access your camera.
				</Text>
				<Text style={styles.text}>
					To utilize this feature in the future you will need to enable camera
					permissions for this app from your phones settings.
				</Text>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	root: {
		backgroundColor: 'transparent',
	},
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 16,
	},
	text: {
		...systemWeights.regular,
		fontSize: 18,
		textAlign: 'center',
	},
	boldText: {
		...systemWeights.bold,
		fontSize: 18,
		textAlign: 'center',
		marginVertical: 10,
	},
});

export default CameraNoAuth;
