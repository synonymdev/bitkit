import React, {
	memo,
	ReactElement,
	useMemo,
	useEffect,
	useCallback,
	useState,
} from 'react';
import { Platform, NativeModules } from 'react-native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import QuickActions from 'react-native-quick-actions';
import { ThemeProvider } from 'styled-components/native';

import { SafeAreaProvider, StatusBar } from './styles/components';
import { getTheme } from './styles/themes';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { toastConfig } from './components/Toast';
import RecoveryNavigator from './screens/Recovery/RecoveryNavigator';
import RestoringScreen from './screens/Onboarding/Restoring';
import AppUpdate from './screens/AppUpdate';
import AppOnboarded from './AppOnboarded';

import './utils/i18n';
import './utils/quick-actions';
import { checkForAppUpdate } from './store/actions/ui';
import { themeSelector } from './store/reselect/settings';
import { walletExistsSelector } from './store/reselect/wallet';
import { requiresRemoteRestoreSelector } from './store/reselect/user';
import { criticalUpdateSelector } from './store/reselect/ui';

const App = (): ReactElement => {
	const [isReady, setIsReady] = useState(false);
	const [showRecovery, setShowRecovery] = useState(false);
	const theme = useSelector(themeSelector);
	const walletExists = useSelector(walletExistsSelector);
	const hasCriticalUpdate = useSelector(criticalUpdateSelector);
	const requiresRemoteRestore = useSelector(requiresRemoteRestoreSelector);

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

	const RootComponent = useCallback((): ReactElement => {
		if (!isReady) {
			return <></>;
		}

		if (showRecovery) {
			return <RecoveryNavigator />;
		}

		if (hasCriticalUpdate) {
			return <AppUpdate />;
		}

		if (walletExists) {
			return (
				<SlashtagsProvider>
					{requiresRemoteRestore ? <RestoringScreen /> : <AppOnboarded />}
				</SlashtagsProvider>
			);
		}

		return <OnboardingNavigator />;
	}, [
		isReady,
		showRecovery,
		hasCriticalUpdate,
		walletExists,
		requiresRemoteRestore,
	]);

	const currentTheme = useMemo(() => getTheme(theme), [theme]);

	return (
		<ThemeProvider theme={currentTheme}>
			<SafeAreaProvider>
				<StatusBar />
				<RootComponent />
				<Toast config={toastConfig} />
			</SafeAreaProvider>
		</ThemeProvider>
	);
};

export default memo(App);
