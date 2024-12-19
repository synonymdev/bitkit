import React, {
	memo,
	ReactElement,
	useState,
	useEffect,
	useCallback,
} from 'react';
import {
	Image,
	Linking,
	Platform,
	Pressable,
	StyleSheet,
	View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Switch } from '../../../styles/components';
import { BodyMSB, BodyM } from '../../../styles/text';
import { FaceIdIcon, TouchIdIcon } from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/buttons/Button';
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
		// use navigation.reset to prevent user from going back to previous screen
		navigation.reset({
			index: 0,
			routes: [{ name: 'Result', params: { bio: false, type: bioType } }],
		});
	};

	const onContinue = useCallback((): void => {
		const bioType = biometryData?.biometryType ?? 'Biometrics';

		if (!biometryData?.available || !shouldEnableBiometrics) {
			navigation.reset({
				index: 0,
				routes: [{ name: 'Result', params: { bio: false, type: bioType } }],
			});
			return;
		}

		rnBiometrics
			.simplePrompt({ promptMessage: t('bio_confirm', { biometricsName }) })
			.then(({ success }) => {
				if (success) {
					dispatch(updateSettings({ biometrics: true }));
					navigation.reset({
						index: 0,
						routes: [{ name: 'Result', params: { bio: true, type: bioType } }],
					});
				}
			})
			.catch(() => {
				showToast({
					type: 'warning',
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
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader
				title={biometricsName}
				showBackButton={false}
			/>

			<View style={styles.content}>
				{!biometryData && <BodyM color="secondary">{t('bio_loading')}</BodyM>}

				{!biometryData?.available && (
					<>
						<BodyM color="secondary">{t('bio_not_available')}</BodyM>
						<View style={styles.imageContainer}>
							<Image style={styles.image} source={imageSrc} />
						</View>
					</>
				)}

				{biometryData?.biometryType && (
					<>
						<BodyM color="secondary">{t('bio_ask', { biometricsName })}</BodyM>
						<View style={styles.imageContainer} pointerEvents="none">
							{biometryData?.biometryType === 'FaceID' ? (
								<FaceIdIcon />
							) : (
								<TouchIdIcon />
							)}
						</View>

						<Pressable
							style={styles.toggle}
							testID="ToggleBiometrics"
							onPress={handleTogglePress}>
							<BodyMSB>{t('bio_use', { biometricsName })}</BodyMSB>
							<Switch
								value={shouldEnableBiometrics}
								onValueChange={handleTogglePress}
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
								text={t('skip')}
								size="large"
								variant="secondary"
								testID="SkipButton"
								onPress={onSkip}
							/>
							<Button
								style={styles.button}
								text={t('bio_phone_settings')}
								size="large"
								onPress={goToSettings}
							/>
						</>
					)}
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
		marginBottom: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	toggle: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 'auto',
		marginBottom: 32,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 16,
	},
	button: {
		paddingHorizontal: 16,
		flex: 1,
	},
});

export default memo(AskForBiometrics);
