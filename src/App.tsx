import React, { memo, ReactElement, useMemo, useEffect, useState } from 'react';
import { Platform, NativeModules } from 'react-native';
import Toast from 'react-native-toast-message';
import QuickActions from 'react-native-quick-actions';
import { ThemeProvider } from 'styled-components/native';

import { SafeAreaProvider, StatusBar } from './styles/components';
import { getTheme } from './styles/themes';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { SlashtagsProvider2 } from './components/SlashtagsProvider2';
import { toastConfig } from './components/Toast';
import RecoveryNavigator from './screens/Recovery/RecoveryNavigator';
import RestoringScreen from './screens/Onboarding/Restoring';
import AppUpdate from './screens/AppUpdate';
import AppOnboarded from './AppOnboarded';

import './utils/i18n';
import './utils/quick-actions';
import './utils/ledger';
import { useAppSelector } from './hooks/redux';
import { checkForAppUpdate } from './store/utils/ui';
import { themeSelector } from './store/reselect/settings';
import { walletExistsSelector } from './store/reselect/wallet';
import { requiresRemoteRestoreSelector } from './store/reselect/user';
import { criticalUpdateSelector } from './store/reselect/ui';

const App = (): ReactElement => {
	const [isReady, setIsReady] = useState(false);
	const [showRecovery, setShowRecovery] = useState(false);
	const theme = useAppSelector(themeSelector);
	const walletExists = useAppSelector(walletExistsSelector);
	const hasCriticalUpdate = useAppSelector(criticalUpdateSelector);
	const requiresRemoteRestore = useAppSelector(requiresRemoteRestoreSelector);

	// on App start
	useEffect(() => {
		// hide splash screen on android
		if (Platform.OS === 'android') {
			setTimeout(NativeModules.SplashScreenModule.hide, 100);
		}

		const checkForRecovery = async (): Promise<void> => {
			const action = await QuickActions.popInitialAction();
			if (action?.title === 'Recovery') {
				setShowRecovery(true);
			}

			setIsReady(true);
		};

		checkForRecovery();
		checkForAppUpdate();
	}, []);

	const currentTheme = useMemo(() => getTheme(theme), [theme]);

	return (
		<ThemeProvider theme={currentTheme}>
			<SafeAreaProvider>
				<StatusBar />

				{!isReady ? (
					<></>
				) : showRecovery ? (
					<RecoveryNavigator />
				) : hasCriticalUpdate ? (
					<AppUpdate />
				) : walletExists ? (
					<SlashtagsProvider>
						<SlashtagsProvider2>
							{requiresRemoteRestore ? <RestoringScreen /> : <AppOnboarded />}
						</SlashtagsProvider2>
					</SlashtagsProvider>
				) : (
					<OnboardingNavigator />
				)}

				<Toast config={toastConfig} />
			</SafeAreaProvider>
		</ThemeProvider>
	);
};

export default memo(App);
