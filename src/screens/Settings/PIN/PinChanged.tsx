import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View as ThemedView } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/check.png');

const PinChanged = ({
	navigation,
}: SettingsScreenProps<'PinChanged'>): ReactElement => {
	const insets = useSafeAreaInsets();

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const handleButtonPress = (): void => {
		navigation.navigate('SecuritySettings');
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="PIN changed" />

			<View style={styles.message}>
				<Text01S color="gray1">
					You have successfully changed your PIN to a new 4-digit combination.
				</Text01S>
			</View>

			<GlowImage image={imageSrc} imageSize={200} glowColor="green" />

			<View style={buttonContainerStyles}>
				<Button size="large" text="OK" onPress={handleButtonPress} />
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

export default memo(PinChanged);
