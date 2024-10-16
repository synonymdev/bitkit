import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import Dialog from '../../components/Dialog';
import SafeAreaInset from '../../components/SafeAreaInset';
import { SlashtagsProvider } from '../../components/SlashtagsProvider';
import Button from '../../components/buttons/Button';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useProfile, useSlashtags } from '../../hooks/slashtags';
import { OnboardingStackScreenProps } from '../../navigation/types';
import { onboardingProfileStepSelector } from '../../store/reselect/slashtags';
import { requiresRemoteRestoreSelector } from '../../store/reselect/user';
import { walletExistsSelector } from '../../store/reselect/wallet';
import { setOnboardingProfileStep } from '../../store/slices/slashtags';
import { updateUser } from '../../store/slices/user';
import { View as ThemedView } from '../../styles/components';
import { BodyM, Display } from '../../styles/text';
import { sleep } from '../../utils/helpers';
import { showToast } from '../../utils/notifications';
import {
	createNewWallet,
	restoreRemoteBackups,
	restoreSeed,
	startWalletServices,
} from '../../utils/startup';
import LoadingWalletScreen from './Loading';

const checkImageSrc = require('../../assets/illustrations/check.png');
const crossImageSrc = require('../../assets/illustrations/cross.png');

export type TCreateWalletParams =
	| {
			action: 'create';
			bip39Passphrase?: string;
	  }
	| {
			action: 'restore';
			mnemonic: string;
			bip39Passphrase?: string;
	  }
	| undefined;

const CreateWallet = ({
	navigation,
	route,
}: OnboardingStackScreenProps<'CreateWallet'>): ReactElement => {
	const params = route.params;
	const { t } = useTranslation('onboarding');
	const dispatch = useAppDispatch();
	const requiresRemoteRestore = useAppSelector(requiresRemoteRestoreSelector);
	const walletExists = useAppSelector(walletExistsSelector);
	const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(
		'loading',
	);
	const [tryAgainCount, setTryAgainCount] = useState(0);
	const [proceedWBIsLoading, setProceedWBIsLoading] = useState(false);
	const [showCautionDialog, setShowCautionDialog] = useState(false);

	const handleCreate = useCallback(
		async (bip39Passphrase?: string) => {
			await sleep(500); // wait for animation to start
			const res = await createNewWallet({ bip39Passphrase });
			if (res.isErr()) {
				showToast({
					type: 'warning',
					title: t('error_create'),
					description: res.error.message,
				});
				navigation.goBack();
			}
		},
		[t, navigation],
	);

	const handleRestore = useCallback(
		async (mnemonic: string, bip39Passphrase?: string) => {
			await sleep(500); // wait for animation to start
			const res = await restoreSeed({
				mnemonic,
				bip39Passphrase,
			});
			if (res.isErr()) {
				showToast({
					type: 'warning',
					title: t('restore_error_title'),
					description: res.error.message,
				});
				navigation.goBack();
			}
		},
		[t, navigation],
	);

	const handleRemoteRestore = useCallback(async (): Promise<void> => {
		setStatus('loading');
		const res = await restoreRemoteBackups();
		await sleep(1000);
		setStatus(res.isErr() ? 'failed' : 'success');
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
		if (walletExists || !params) {
			return;
		}

		if (params.action === 'create') {
			handleCreate(params.bip39Passphrase);
		} else {
			handleRestore(params.mnemonic, params.bip39Passphrase);
		}
	}, [walletExists, params, handleCreate, handleRestore]);

	useEffect(() => {
		if (!walletExists || !requiresRemoteRestore) {
			return;
		}

		handleRemoteRestore();
	}, [walletExists, requiresRemoteRestore, handleRemoteRestore]);

	let content = <LoadingWalletScreen isRestoring={requiresRemoteRestore} />;

	if (status === 'success' || status === 'failed') {
		const success = status === 'success';
		const color = success ? 'green' : 'red';
		const title = t(
			success ? 'restore_success_header' : 'restore_failed_header',
		);
		const subtitle = t(
			success ? 'restore_success_text' : 'restore_failed_text',
		);
		const imageSrc = success ? checkImageSrc : crossImageSrc;
		const buttonText = t(success ? 'get_started' : 'try_again');

		const onPress = (): void => {
			if (success) {
				// App.tsx will show wallet now
				dispatch(updateUser({ requiresRemoteRestore: false }));
			} else {
				setTryAgainCount((v) => v + 1);
				handleRemoteRestore();
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
						testID={success ? 'GetStartedButton' : 'TryAgainButton'}
						onPress={onPress}
					/>
					{tryAgainCount > 1 && !success && (
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

				<SlashtagsProvider>
					<SkipSlashtagsOnboading />
				</SlashtagsProvider>
			</View>
		);
	}

	return <ThemedView style={styles.root}>{content}</ThemedView>;
};

// this component is used to skip the slashtags onboarding process if profile is already created
const SkipSlashtagsOnboading = (): ReactElement => {
	const dispatch = useAppDispatch();
	const onboardingStep = useAppSelector(onboardingProfileStepSelector);
	const { url } = useSlashtags();
	const { profile } = useProfile(url);

	useEffect(() => {
		if (onboardingStep !== 'Done' && profile.name) {
			dispatch(setOnboardingProfileStep('Done'));
		}
	}, [profile.name, onboardingStep, dispatch]);

	return <></>;
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

export default CreateWallet;
