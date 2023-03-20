import React, { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../styles/components';
import { Text01S, Title } from '../styles/text';
import SafeAreaInsets from '../components/SafeAreaInsets';
import GlowImage from '../components/GlowImage';
import Button from '../components/Button';
import { openURL } from '../utils/helpers';
import { availableUpdateSelector } from '../store/reselect/ui';

const imageSrc = require('../assets/illustrations/bitkit-logo.png');

const AppUpdate = (): ReactElement => {
	const { t } = useTranslation('other');
	const updateInfo = useSelector(availableUpdateSelector);

	const onUpdate = async (): Promise<void> => {
		await openURL(updateInfo?.url!);
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<Title style={styles.header}>{t('up_title')}</Title>
			<View style={styles.content}>
				<Text01S color="gray1">{t('up_text')}</Text01S>

				<GlowImage image={imageSrc} />

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('up_button')}
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
