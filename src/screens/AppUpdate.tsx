import React, { ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../styles/components';
import { BodyM, Title } from '../styles/text';
import SafeAreaInset from '../components/SafeAreaInset';
import Button from '../components/Button';
import { useAppSelector } from '../hooks/redux';
import { openURL } from '../utils/helpers';
import { availableUpdateSelector } from '../store/reselect/ui';

const imageSrc = require('../assets/illustrations/exclamation-mark.png');

const AppUpdate = (): ReactElement => {
	const { t } = useTranslation('other');
	const updateInfo = useAppSelector(availableUpdateSelector);

	const onUpdate = async (): Promise<void> => {
		await openURL(updateInfo?.url!);
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<Title style={styles.header}>{t('up_title')}</Title>
			<View style={styles.content}>
				<BodyM color="secondary">{t('up_text')}</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('up_button')}
						size="large"
						onPress={onUpdate}
					/>
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
	header: {
		textAlign: 'center',
		paddingBottom: 35,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		alignSelf: 'center',
		alignItems: 'center',
		marginTop: 'auto',
		aspectRatio: 1,
		height: 300,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default AppUpdate;
