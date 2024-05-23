import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display, BodyM } from '../../styles/text';
import { View as ThemedView } from '../../styles/components';
import { IColors } from '../../styles/colors';
import { restoreRemoteBackups, startWalletServices } from '../../utils/startup';
import { showToast } from '../../utils/notifications';
import { sleep } from '../../utils/helpers';
import { updateUser } from '../../store/slices/user';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import LoadingWalletScreen from './Loading';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useProfile2, useSelectedSlashtag2 } from '../../hooks/slashtags2';
import { setOnboardingProfileStep } from '../../store/slices/slashtags';
import { onboardingProfileStepSelector } from '../../store/reselect/slashtags';
import { Image } from 'react-native';

const checkImageSrc = require('../../assets/illustrations/check.png');
const crossImageSrc = require('../../assets/illustrations/cross.png');

let attemptedAutoRestore = false;

const RestoringScreen = (): ReactElement => {
	const { t } = useTranslation('onboarding');
	const { url } = useSelectedSlashtag2();
	const { profile } = useProfile2(url);
	const dispatch = useAppDispatch();
	const onboardingStep = useAppSelector(onboardingProfileStepSelector);
	const [showRestored, setShowRestored] = useState(false);
	const [showFailed, setShowFailed] = useState(false);
	const [proceedWBIsLoading, setProceedWBIsLoading] = useState(false);
	const [tryAgainCount, setTryAgainCount] = useState(0);
	const [showCautionDialog, setShowCautionDialog] = useState(false);

	const onRemoteRestore = useCallback(async (): Promise<void> => {
		attemptedAutoRestore = true;
		setShowFailed(false);
		setShowRestored(false);

		const res = await restoreRemoteBackups();
		await sleep(1000);
		if (res.isErr()) {
			return setShowFailed(true);
		}

		setShowRestored(true);
	}, []);

	const proceedWithoutBackup = useCallback(async () => {
		setShowCautionDialog(false);
		setProceedWBIsLoading(true);
		const res = await startWalletServices({ restore: false });
		if (res.isErr()) {
			console.log(res.error.message);
			showToast({
				type: 'warning',
				title: t('restore_error_title'),
				description: t('restore_error_description'),
			});
			return;
		}
		setProceedWBIsLoading(false);
		// This will navigate the user to the main wallet view once startWalletServices has run successfully.
		dispatch(updateUser({ requiresRemoteRestore: false }));
	}, [t, dispatch]);

	useEffect(() => {
		if (attemptedAutoRestore) {
			return;
		}

		onRemoteRestore().then();
	}, [onRemoteRestore]);

	useEffect(() => {
		// If the user has a name, we can assume they have completed the profile onboarding
		if (onboardingStep !== 'Done' && profile.name) {
			dispatch(setOnboardingProfileStep('Done'));
		}
	}, [profile.name, onboardingStep, dispatch]);

	let color: keyof IColors = 'brand';
	let content = <LoadingWalletScreen />;

	if (showRestored || showFailed) {
		color = showRestored ? 'green' : 'red';
		const title = t(
			showRestored ? 'restore_success_header' : 'restore_failed_header',
		);
		const subtitle = t(
			showRestored ? 'restore_success_text' : 'restore_failed_text',
		);
		const imageSrc = showRestored ? checkImageSrc : crossImageSrc;
		const buttonText = t(showRestored ? 'get_started' : 'try_again');

		const onPress = (): void => {
			if (showRestored) {
				//App.tsx will show wallet now
				dispatch(updateUser({ requiresRemoteRestore: false }));
			} else {
				onRemoteRestore().then().catch(console.error);
				setTryAgainCount(tryAgainCount + 1);
			}
		};

		content = (
			<View style={styles.content}>
				<Display style={styles.title}>
					<Trans
						t={t}
						i18nKey={title}
						components={{ accent: <Display color={color} /> }}
					/>
				</Display>
				<BodyM color="white80">{subtitle}</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={buttonText}
						testID={showRestored ? 'GetStartedButton' : 'TryAgainButton'}
						onPress={onPress}
					/>
					{tryAgainCount > 1 && showFailed && (
						<Button
							style={styles.proceedButton}
							text={t('restore_no_backup_button')}
							size="large"
							loading={proceedWBIsLoading}
							variant="secondary"
							onPress={(): void => {
								setShowCautionDialog(true);
							}}
						/>
					)}
				</View>

				<Dialog
					visible={showCautionDialog}
					title={t('are_you_sure')}
					description={t('restore_no_backup_warn')}
					confirmText={t('yes_proceed')}
					onCancel={(): void => {
						setShowCautionDialog(false);
					}}
					onConfirm={proceedWithoutBackup}
				/>

				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		);
	}

	return <ThemedView style={styles.root}>{content}</ThemedView>;
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
		paddingTop: 120,
	},
	title: {
		marginBottom: 4,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		marginTop: 'auto',
	},
	proceedButton: {
		marginTop: 10,
	},
});

export default RestoringScreen;
