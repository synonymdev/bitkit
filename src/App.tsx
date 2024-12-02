import React, {
	ReactElement,
	Suspense,
	lazy,
	memo,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { NativeModules, Platform } from 'react-native';
import QuickActions from 'react-native-quick-actions';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from 'styled-components/native';

import './utils/i18n';
import './utils/quick-actions';
import AppOnboarded from './AppOnboarded';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { toastConfig } from './components/Toast';
import { useAppSelector } from './hooks/redux';
import AppUpdate from './screens/AppUpdate';
import { themeSelector } from './store/reselect/settings';
import { criticalUpdateSelector } from './store/reselect/ui';
import { requiresRemoteRestoreSelector } from './store/reselect/user';
import { walletExistsSelector } from './store/reselect/wallet';
import { checkForAppUpdate } from './store/utils/ui';
import { SafeAreaProvider, StatusBar } from './styles/components';
import { getTheme } from './styles/themes';

const RecoveryNavigator = lazy(
	() => import('./screens/Recovery/RecoveryNavigator'),
);
const OnboardingNavigator = lazy(
	() => import('./navigation/onboarding/OnboardingNavigator'),
);

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
					<Suspense fallback={null}>
						<RecoveryNavigator />
					</Suspense>
				) : hasCriticalUpdate ? (
					<AppUpdate />
				) : walletExists && !requiresRemoteRestore ? (
					<SlashtagsProvider>
						<AppOnboarded />
					</SlashtagsProvider>
				) : (
					<Suspense fallback={null}>
						<OnboardingNavigator />
					</Suspense>
				)}

				<Toast config={toastConfig} />
			</SafeAreaProvider>
		</ThemeProvider>
	);
};

export default memo(App);
