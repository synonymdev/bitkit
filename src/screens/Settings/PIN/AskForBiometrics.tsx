import React, { memo, ReactElement, useState, useEffect, useMemo } from 'react';
import { Image, Linking, Platform, StyleSheet, View } from 'react-native';
import rnBiometrics from 'react-native-biometrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	FaceIdIcon,
	Switch,
	Text01M,
	Text01S,
	TouchIdIcon,
} from '../../../styles/components';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { toggleBiometrics } from '../../../utils/settings';
import { IsSensorAvailableResult } from '../../../components/Biometrics';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import { showErrorNotification } from '../../../utils/notifications';
import type { PinScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/cog.png');

const AskForBiometrics = ({
	navigation,
}: PinScreenProps<'AskForBiometrics'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const [enabled, setEnabled] = useState<boolean>(false);
	const [biometryData, setBiometricData] = useState<IsSensorAvailableResult>();

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	useEffect(() => {
		rnBiometrics.isSensorAvailable().then((data) => setBiometricData(data));
	}, []);

	const buttonText = biometryData?.available === false ? 'Skip' : 'Continue';

	const handleOnBack = (): void => {
		navigation.goBack();
	};

	const goToSettings = (): void => {
		Platform.OS === 'ios'
			? Linking.openURL('App-Prefs:Settings')
			: Linking.sendIntent('android.settings.SETTINGS');
	};

	const handleButtonPress = (): void => {
		if (biometryData?.available === false || !enabled) {
			navigation.navigate('Result', { bio: false });
			return;
		}

		rnBiometrics
			.simplePrompt({ promptMessage: 'Bitkit' })
			.then(({ success }) => {
				if (!success) {
					showErrorNotification({
						title: 'Biometrics Failed',
						message: 'Something went wrong.',
					});
				}
				toggleBiometrics(true);
				navigation.navigate('Result', { bio: true });
			})
			.catch(() => {
				showErrorNotification({
					title: 'Biometrics Failed',
					message: 'Something went wrong.',
				});
			});
	};

	const typeName =
		biometryData?.biometryType === 'TouchID'
			? 'Touch ID'
			: biometryData?.biometryType === 'FaceID'
			? 'Face ID'
			: biometryData?.biometryType ?? 'Biometrics';

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={typeName}
				onBackPress={handleOnBack}
			/>

			<View style={styles.content}>
				{!biometryData && <Text01S color="gray1">Loading...</Text01S>}

				{!biometryData?.available && (
					<>
						<Text01S color="gray1">
							Looks like you haven’t set up biometric security for your device
							yet (or it is not supported). You can try to enable biometric
							security in the phone settings.
						</Text01S>
						<View style={styles.imageContainer} pointerEvents="none">
							<Glow style={styles.glow} color="yellow" />
							<Image source={imageSrc} style={styles.image} />
						</View>
					</>
				)}

				{biometryData?.biometryType && (
					<>
						<Text01S color="gray1">
							PIN code set. Would you like to use {typeName} instead of your PIN
							code whenever possible?
						</Text01S>
						<View style={styles.imageContainer} pointerEvents="none">
							<Glow style={styles.glow} size={600} color="brand" />
							{biometryData?.biometryType === 'FaceID' ? (
								<FaceIdIcon />
							) : (
								<TouchIdIcon />
							)}
						</View>
						<View style={styles.switchContainer}>
							<Text01M>Use {typeName}</Text01M>
							<Switch
								onValueChange={(): void => setEnabled((e) => !e)}
								value={enabled}
							/>
						</View>
					</>
				)}

				<View style={buttonContainerStyles}>
					{!biometryData?.available && (
						<>
							<Button
								style={styles.button}
								size="large"
								variant="secondary"
								text="Phone Settings"
								onPress={goToSettings}
							/>
							<View style={styles.divider} />
						</>
					)}

					<Button
						style={styles.button}
						size="large"
						text={buttonText}
						onPress={handleButtonPress}
						disabled={!biometryData}
					/>
				</View>
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
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
	switchContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alighItems: 'center',
		marginBottom: 32,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		paddingHorizontal: 16,
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(AskForBiometrics);
