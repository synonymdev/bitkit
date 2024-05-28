import React, { ReactElement, memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { View as ThemedView } from '../../../styles/components';
import { BodyM } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/check.png');

const AddConnectionResult = ({
	navigation,
}: SettingsScreenProps<'LightningAddConnectionResult'>): ReactElement => {
	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title="Connection opened" />
			<View style={styles.content}>
				<BodyM color="secondary" style={styles.text}>
					You successfully opened a connection with ‘LNBIG Lightning Node’. It
					might take a while for the connection to become ready for use.
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View>
					<Button
						text="OK"
						size="large"
						onPress={(): void => {
							navigation.goBack();
							navigation.goBack();
						}}
					/>
					<SafeAreaInset type="bottom" minPadding={16} />
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
});

export default memo(AddConnectionResult);
