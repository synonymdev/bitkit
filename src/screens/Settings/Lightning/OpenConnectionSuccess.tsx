import React, { ReactElement, memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { View as ThemedView } from '../../../styles/components';
import { BodyM } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/check.png');

const OpenConnectionSuccess = ({
	navigation,
	route,
}: SettingsScreenProps<'OpenConnectionSuccess'>): ReactElement => {
	const { name } = route.params;

	const onContinue = (): void => {
		navigation.popToTop();
		navigation.goBack();
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title="Connection Opened" displayBackButton={false} />
			<View style={styles.content}>
				<BodyM color="secondary">
					You succesfully opened a connection with ‘{name}’. It might take a
					while for the connection to become ready for use.
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttons}>
					<Button text="OK" size="large" onPress={onContinue} />
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttons: {
		marginTop: 'auto',
	},
});

export default memo(OpenConnectionSuccess);
