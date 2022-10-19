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
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from 'styled-components/native';

import { SafeAreaProvider, StatusBar } from './styles/components';
import Store from './store/types';
import themes from './styles/themes';
import { TTheme } from './store/types/settings';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { toastConfig } from './components/Toast';
import AppOnboarded from './AppOnboarded';

import './utils/translations';

if (Platform.OS === 'android') {
	if (UIManager.setLayoutAnimationEnabledExperimental) {
		UIManager.setLayoutAnimationEnabledExperimental(true);
	}
}

const App = (): ReactElement => {
	const walletExists = useSelector((state: Store) => state.wallet.walletExists);
	const theme = useSelector((state: Store) => state.settings.theme);

	// on App start
	useEffect(() => {
		// hide splash screen on android
		if (Platform.OS === 'android') {
			setTimeout(NativeModules.SplashScreenModule.hide, 100);
		}
	}, []);

	const currentTheme: TTheme = useMemo(() => themes[theme], [theme]);

	const RootComponent = useCallback((): ReactElement => {
		return walletExists ? (
			<SlashtagsProvider>
				<AppOnboarded />
			</SlashtagsProvider>
		) : (
			<OnboardingNavigator />
		);
	}, [walletExists]);

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
