import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View as ThemedView, Text01S } from '../../../styles/components';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { removePin } from '../../../utils/settings';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/padlock2.png');

const DisablePin = ({
	navigation,
}: SettingsScreenProps<'DisablePin'>): ReactElement => {
	const insets = useSafeAreaInsets();

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const handleButtonPress = (): void => {
		navigation.navigate('AuthCheck', {
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
				title="Disable PIN"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>

			<View style={styles.message}>
				<Text01S color="gray1">
					PIN code is currently enabled. If you want to disable your PIN, you
					need to enter your current PIN code first.
				</Text01S>
			</View>

			<View style={styles.imageContainer} pointerEvents="none">
				<Glow style={styles.glow} size={600} color="brand" />
				<Image source={imageSrc} style={styles.image} />
			</View>

			<View style={buttonContainerStyles}>
				<Button size="large" text="Disable PIN" onPress={handleButtonPress} />
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
	imageContainer: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: 200,
		height: 200,
	},
	glow: {
		position: 'absolute',
	},
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 16,
		width: '100%',
	},
});

export default memo(DisablePin);
