import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { removePin } from '../../../utils/settings';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/padlock2.png');

const DisablePin = ({
	navigation,
}: SettingsScreenProps<'DisablePin'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation('security');

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const handleButtonPress = (): void => {
		navigation.navigate('AuthCheck', {
			requirePin: true,
			onSuccess: () => {
				// hack needed for Android
				setTimeout(() => {
					removePin();
					navigation.replace('SecuritySettings');
				}, 100);
			},
		});
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
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

			<View style={buttonContainerStyles}>
				<Button
					size="large"
					text={t('pin_disable_button')}
					onPress={handleButtonPress}
					testID="DisablePin"
				/>
			</View>
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
