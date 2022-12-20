import React, {
	memo,
	ReactElement,
	useState,
	useEffect,
	useMemo,
	useCallback,
} from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import rnBiometrics from 'react-native-biometrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	FaceIdIcon,
	Switch,
	Text01M,
	Text01S,
	TouchIdIcon,
} from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { IsSensorAvailableResult } from '../../../components/Biometrics';
import { showErrorNotification } from '../../../utils/notifications';
import { updateSettings } from '../../../store/actions/settings';
import type { PinScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/cog.png');
const goToSettings = (): void => {
	Platform.OS === 'ios'
		? Linking.openURL('App-Prefs:Settings')
		: Linking.sendIntent('android.settings.SETTINGS');
};

const AskForBiometrics = ({
	navigation,
}: PinScreenProps<'AskForBiometrics'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const [biometryData, setBiometricData] = useState<IsSensorAvailableResult>();
	const [shouldEnableBiometrics, setShouldEnableBiometrics] = useState(false);

	useEffect(() => {
		rnBiometrics.isSensorAvailable().then((data) => setBiometricData(data));
	}, []);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const buttonText = useMemo(() => {
		return !biometryData?.available ? 'Skip' : 'Continue';
	}, [biometryData?.available]);

	const typeName = useMemo(
		() =>
			biometryData?.biometryType === 'TouchID'
				? 'Touch ID'
				: biometryData?.biometryType === 'FaceID'
				? 'Face ID'
				: biometryData?.biometryType ?? 'Biometrics',
		[biometryData?.biometryType],
	);

	const handleOnBack = (): void => {
		navigation.goBack();
	};

	const handleButtonPress = useCallback((): void => {
		if (!biometryData?.available || !shouldEnableBiometrics) {
			navigation.navigate('Result', { bio: false });
			return;
		}

		rnBiometrics
			.simplePrompt({ promptMessage: `Confirm ${typeName}` })
			.then(({ success }) => {
				if (success) {
					updateSettings({ biometrics: true });
					navigation.navigate('Result', { bio: true });
				}
			})
			.catch(() => {
				showErrorNotification({
					title: 'Biometrics Setup Failed',
					message: "Bitkit wasn't able to setup biometrics for your device.",
				});
			});
	}, [biometryData?.available, shouldEnableBiometrics, typeName, navigation]);

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
						<GlowImage image={imageSrc} imageSize={200} glowColor="yellow" />
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
								onValueChange={(): void => setShouldEnableBiometrics((e) => !e)}
								value={shouldEnableBiometrics}
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
