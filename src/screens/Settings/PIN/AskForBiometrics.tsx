import React, {
	memo,
	ReactElement,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Switch } from '../../../styles/components';
import { Text01M, Text01S } from '../../../styles/text';
import { FaceIdIcon, TouchIdIcon } from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { IsSensorAvailableResult } from '../../../components/Biometrics';
import { useAppDispatch } from '../../../hooks/redux';
import rnBiometrics from '../../../utils/biometrics';
import { showToast } from '../../../utils/notifications';
import { updateSettings } from '../../../store/slices/settings';
import type { PinScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/cog.png');

const AskForBiometrics = ({
	navigation,
}: PinScreenProps<'AskForBiometrics'>): ReactElement => {
	const { t } = useTranslation('security');
	const dispatch = useAppDispatch();
	const [biometryData, setBiometricData] = useState<IsSensorAvailableResult>();
	const [shouldEnableBiometrics, setShouldEnableBiometrics] = useState(false);

	useEffect(() => {
		(async (): Promise<void> => {
			const data = await rnBiometrics.isSensorAvailable();
			setBiometricData(data);
		})();
	}, []);

	const biometricsName =
		biometryData?.biometryType === 'TouchID'
			? t('bio_touch_id')
			: biometryData?.biometryType === 'FaceID'
			? t('bio_face_id')
			: biometryData?.biometryType ?? t('bio');

	const handleTogglePress = (): void => {
		setShouldEnableBiometrics((prevState) => !prevState);
	};

	const goToSettings = (): void => {
		Platform.OS === 'ios'
			? Linking.openURL('App-Prefs:Settings')
			: Linking.sendIntent('android.settings.SETTINGS');
	};

	const onSkip = (): void => {
		const bioType = biometryData?.biometryType ?? 'Biometrics';
		navigation.navigate('Result', { bio: false, type: bioType });
	};

	const onContinue = useCallback((): void => {
		const bioType = biometryData?.biometryType ?? 'Biometrics';

		if (!biometryData?.available || !shouldEnableBiometrics) {
			navigation.navigate('Result', { bio: false, type: bioType });
			return;
		}

		rnBiometrics
			.simplePrompt({ promptMessage: t('bio_confirm', { biometricsName }) })
			.then(({ success }) => {
				if (success) {
					dispatch(updateSettings({ biometrics: true }));
					navigation.navigate('Result', { bio: true, type: bioType });
				}
			})
			.catch(() => {
				showToast({
					type: 'error',
					title: t('bio_error_title'),
					description: t('bio_error_message', { type: biometricsName }),
				});
			});
	}, [
		biometryData?.available,
		biometryData?.biometryType,
		shouldEnableBiometrics,
		biometricsName,
		navigation,
		dispatch,
		t,
	]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={biometricsName} />

			<View style={styles.content}>
				{!biometryData && <Text01S color="gray1">{t('bio_loading')}</Text01S>}

				{!biometryData?.available && (
					<>
						<Text01S color="gray1">{t('bio_not_available')}</Text01S>
						<GlowImage image={imageSrc} imageSize={200} glowColor="yellow" />
					</>
				)}

				{biometryData?.biometryType && (
					<>
						<Text01S color="gray1">{t('bio_ask', { biometricsName })}</Text01S>
						<View style={styles.imageContainer} pointerEvents="none">
							<Glow style={styles.glow} size={600} color="brand" />
							{biometryData?.biometryType === 'FaceID' ? (
								<FaceIdIcon />
							) : (
								<TouchIdIcon />
							)}
						</View>

						<Pressable
							style={styles.toggle}
							onPress={handleTogglePress}
							testID="ToggleBiometrics">
							<Text01M>{t('bio_use', { biometricsName })}</Text01M>
							<Switch
								onValueChange={handleTogglePress}
								value={shouldEnableBiometrics}
							/>
						</Pressable>
					</>
				)}

				<View style={styles.buttonContainer}>
					{biometryData?.available ? (
						<Button
							style={styles.button}
							size="large"
							text={t('continue')}
							testID="ContinueButton"
							onPress={onContinue}
						/>
					) : (
						<>
							<Button
								style={styles.button}
								size="large"
								text={t('skip')}
								variant="secondary"
								testID="SkipButton"
								onPress={onSkip}
							/>
							<View style={styles.divider} />
							<Button
								style={styles.button}
								size="large"
								text={t('bio_phone_settings')}
								onPress={goToSettings}
							/>
						</>
					)}
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
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
	toggle: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
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
