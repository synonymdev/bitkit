import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { View as ThemedView } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import GlowImage from '../../../components/GlowImage';
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
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Connection Opened" displayBackButton={false} />
			<View style={styles.content}>
				<Text01S color="gray1">
					You succesfully opened a connection with ‘{name}’. It might take a
					while for the connection to become ready for use.
				</Text01S>

				<GlowImage image={imageSrc} glowColor="green" />

				<View style={styles.buttons}>
					<Button text="OK" size="large" onPress={onContinue} />
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
	content: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	buttons: {
		marginTop: 'auto',
		marginBottom: 16,
	},
});

export default memo(OpenConnectionSuccess);
