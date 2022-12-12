import '../shim';
import 'intl';
import 'intl/locale-data/jsonp/en';
import React, {
	memo,
	ReactElement,
	useMemo,
	useEffect,
	useCallback,
} from 'react';
import { Platform, UIManager, NativeModules } from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from 'styled-components/native';

import { SafeAreaProvider, StatusBar } from './styles/components';
import themes from './styles/themes';
import { TTheme } from './store/types/settings';
// import { checkForAppUpdate } from './store/actions/ui';
import { useAppSelector } from './hooks/redux';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { toastConfig } from './components/Toast';
import RestoringScreen from './screens/Onboarding/Restoring';
import AppUpdate from './screens/AppUpdate';
import AppOnboarded from './AppOnboarded';

import './utils/translations';

if (Platform.OS === 'android') {
	if (UIManager.setLayoutAnimationEnabledExperimental) {
		UIManager.setLayoutAnimationEnabledExperimental(true);
	}
}

const App = (): ReactElement => {
	const theme = useAppSelector((state) => state.settings.theme);
	const walletExists = useAppSelector((state) => state.wallet.walletExists);
	const requiresRemoteRestore = useAppSelector(
		(state) => state.user.requiresRemoteRestore,
	);
	const availableUpdateType = useAppSelector(
		(state) => state.ui.availableUpdateType,
	);

	// on App start
	useEffect(() => {
		// hide splash screen on android
		if (Platform.OS === 'android') {
			setTimeout(NativeModules.SplashScreenModule.hide, 100);
		}

		// check for Bitkit update
		// TEMP: disabled for now
		// checkForAppUpdate();
	}, []);

	const currentTheme: TTheme = useMemo(() => themes[theme], [theme]);

	const RootComponent = useCallback((): ReactElement => {
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
	}, [availableUpdateType, walletExists, requiresRemoteRestore]);

	return (
		<ThemeProvider theme={currentTheme}>
			<SafeAreaProvider>
				<StatusBar />
				<RootComponent />
			</SafeAreaProvider>
			<Toast config={toastConfig} />
		</ThemeProvider>
	);
};

export default memo(App);
