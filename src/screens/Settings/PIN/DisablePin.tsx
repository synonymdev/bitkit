import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import NavigationHeader from '../../../components/NavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { removePin } from '../../../utils/settings';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/padlock2.png');

const DisablePin = ({
	navigation,
}: SettingsScreenProps<'DisablePin'>): ReactElement => {
	const { t } = useTranslation('security');

	const handleButtonPress = (): void => {
		navigation.navigate('AuthCheck', {
			requirePin: true,
			onSuccess: () => {
				// hack needed for Android
				setTimeout(() => {
					removePin();
					navigation.pop(2);
				}, 100);
			},
		});
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			<View style={styles.message}>
				<Text01S color="gray1">{t('pin_disable_text')}</Text01S>
			</View>

			<GlowImage image={imageSrc} imageSize={200} />

			<View style={styles.buttonContainer}>
				<Button
					size="large"
					text={t('pin_disable_button')}
					onPress={handleButtonPress}
					testID="DisablePin"
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
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 16,
		width: '100%',
	},
});

export default memo(DisablePin);
