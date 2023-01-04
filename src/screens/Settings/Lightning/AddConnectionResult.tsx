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

const AddConnectionResult = ({
	navigation,
}: SettingsScreenProps<'LightningAddConnectionResult'>): ReactElement => {
	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Connection opened" />
			<View style={styles.content}>
				<Text01S color="gray1" style={styles.text}>
					You successfully opened a connection with ‘LNBIG Lightning Node’. It
					might take a while for the connection to become ready for use.
				</Text01S>

				<GlowImage image={imageSrc} imageSize={200} glowColor="green" />

				<View>
					<Button
						text="OK"
						size="large"
						onPress={(): void => {
							navigation.goBack();
							navigation.goBack();
						}}
					/>
					<SafeAreaInsets type="bottom" />
				</View>
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 16,
		marginBottom: 16,
	},
});

export default memo(AddConnectionResult);
