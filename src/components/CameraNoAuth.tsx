import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { systemWeights } from 'react-native-typography';
import { Trans, useTranslation } from 'react-i18next';

import { View } from '../styles/components';
import { Text } from '../styles/text';
import { EvilIcon } from '../styles/icons';
import NavigationHeader from './NavigationHeader';
import SafeAreaView from './SafeAreaView';

const CameraNoAuth = (): ReactElement => {
	const { t } = useTranslation('other');

	return (
		<SafeAreaView style={styles.root}>
			<NavigationHeader title="Permission" />
			<View style={styles.container} color="transparent">
				<EvilIcon name="exclamation" size={60} />
				<Text style={styles.text}>
					<Trans
						t={t}
						i18nKey="camera_no_text"
						components={{
							bold: <Text style={styles.boldText} />,
						}}
					/>
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
		marginTop: 18,
		...systemWeights.regular,
		fontSize: 18,
		textAlign: 'center',
	},
	boldText: {
		...systemWeights.bold,
		fontSize: 18,
		textAlign: 'center',
	},
});

export default CameraNoAuth;
