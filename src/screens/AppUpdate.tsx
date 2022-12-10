import React, { ReactElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { getBundleId } from 'react-native-device-info';

import { View as ThemedView, Text01S, Title } from '../styles/components';
import SafeAreaInsets from '../components/SafeAreaInsets';
import GlowImage from '../components/GlowImage';
import Button from '../components/Button';
import { openURL } from '../utils/helpers';

const imageSrc = require('../assets/illustrations/bitkit-logo.png');

// TODO: add correct store IDs and test
// const appleAppID = '1634634088';
const androidPackageName = getBundleId();
const appStoreUrl =
	Platform.OS === 'ios'
		? 'https://testflight.apple.com/join/lGXhnwcC'
		: `https://play.google.com/store/apps/details?id=${androidPackageName}`;

const AppUpdate = (): ReactElement => {
	const onUpdate = async (): Promise<void> => {
		await openURL(appStoreUrl);
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<Title style={styles.header}>Critical Update</Title>
			<View style={styles.content}>
				<Text01S color="gray1">
					There is a critical update available for Bitkit. You must update to
					continue using Bitkit.
				</Text01S>

				<GlowImage image={imageSrc} />

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text="Update Bitkit"
						size="large"
						onPress={onUpdate}
					/>
				</View>
			</View>
			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	header: {
		textAlign: 'center',
		marginTop: 17,
		paddingBottom: 35,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		marginBottom: 16,
	},
	button: {
		flex: 1,
	},
});

export default AppUpdate;
