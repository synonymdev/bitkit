import '../shim';
import 'intl';
import 'intl/locale-data/jsonp/en';
import React, {
	memo,
	ReactElement,
	useMemo,
	useEffect,
	useCallback,
	useState,
} from 'react';
import { Platform, UIManager, NativeModules } from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from 'styled-components/native';
import RNShake from 'react-native-shake';

import { SafeAreaProvider, StatusBar } from './styles/components';
import themes from './styles/themes';
// import { checkForAppUpdate } from './store/actions/ui';
import { useAppSelector } from './hooks/redux';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { toastConfig } from './components/Toast';
import RecoveryNavigator from './screens/Recovery/RecoveryNavigator';
import RestoringScreen from './screens/Onboarding/Restoring';
import AppUpdate from './screens/AppUpdate';
import AppOnboarded from './AppOnboarded';

import './utils/translations';
import { RECOVERY_DELAY } from './utils/startup/constants';
import { themeSelector } from './store/reselect/settings';
import { walletExistsSelector } from './store/reselect/wallet';
import { requiresRemoteRestoreSelector } from './store/reselect/user';
import { availableUpdateTypeSelector } from './store/reselect/ui';

if (Platform.OS === 'android') {
	if (UIManager.setLayoutAnimationEnabledExperimental) {
		UIManager.setLayoutAnimationEnabledExperimental(true);
	}
}

const App = (): ReactElement => {
	const [hasShaken, setHasShaken] = useState(false);
	const theme = useAppSelector(themeSelector);
	const walletExists = useAppSelector(walletExistsSelector);
	const requiresRemoteRestore = useAppSelector(requiresRemoteRestoreSelector);
	const availableUpdateType = useAppSelector(availableUpdateTypeSelector);

	// on App start
	useEffect(() => {
		// hide splash screen on android
		if (Platform.OS === 'android') {
			setTimeout(NativeModules.SplashScreenModule.hide, 100);
		}

		// check for Bitkit update
		// TEMP: disabled for now
		// checkForAppUpdate();

		// Shake in the first 3s of startup to enter recovery
		const subscription = RNShake.addListener((): void => setHasShaken(true));
		setTimeout((): void => subscription.remove(), RECOVERY_DELAY);

		return (): void => {
			subscription.remove();
		};
	}, []);

	const currentTheme = useMemo(() => themes[theme], [theme]);

	const RootComponent = useCallback((): ReactElement => {
		if (hasShaken) {
			return <RecoveryNavigator />;
		}

		if (availableUpdateType === 'critical') {
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
	}, [hasShaken, availableUpdateType, walletExists, requiresRemoteRestore]);

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
