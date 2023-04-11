import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { View } from '../styles/components';
import { Text01S, Text01B } from '../styles/text';
import { ExclamationIcon } from '../styles/icons';
import NavigationHeader from './NavigationHeader';
import SafeAreaView from './SafeAreaView';

const CameraNoAuth = (): ReactElement => {
	const { t } = useTranslation('other');

	return (
		<SafeAreaView style={styles.root}>
			<NavigationHeader title="Permission" />
			<View style={styles.container} color="transparent">
				<ExclamationIcon />
				<Text01S style={styles.text}>
					<Trans
						t={t}
						i18nKey="camera_no_text"
						components={{
							bold: <Text01B />,
						}}
					/>
				</Text01S>
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
		textAlign: 'center',
	},
});

export default CameraNoAuth;
