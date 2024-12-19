import React, { memo, ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { BodyM } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/buttons/Button';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/check.png');

const PinChanged = ({
	navigation,
}: SettingsScreenProps<'PinChanged'>): ReactElement => {
	const { t } = useTranslation('security');

	const handleButtonPress = (): void => {
		navigation.navigate('SecuritySettings');
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('cp_changed_title')}
				showBackButton={false}
				showCloseButton={false}
			/>

			<View style={styles.message}>
				<BodyM color="secondary">{t('cp_changed_text')}</BodyM>
			</View>

			<View style={styles.imageContainer}>
				<Image style={styles.image} source={imageSrc} />
			</View>

			<View style={styles.buttonContainer}>
				<Button
					size="large"
					text={t('ok')}
					testID="OK"
					onPress={handleButtonPress}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	message: {
		marginHorizontal: 16,
		alignSelf: 'flex-start',
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
		marginTop: 'auto',
		paddingHorizontal: 16,
		width: '100%',
	},
});

export default memo(PinChanged);
