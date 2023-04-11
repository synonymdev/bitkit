import '../shim';

import React, {
	memo,
	ReactElement,
	useMemo,
	useEffect,
	useCallback,
	useState,
} from 'react';
import {
	Platform,
	UIManager,
	NativeModules,
	Pressable,
	StyleSheet,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from 'styled-components/native';

import { SafeAreaProvider, StatusBar } from './styles/components';
import { getTheme } from './styles/themes';
import { checkForAppUpdate } from './store/actions/ui';
import { useAppSelector } from './hooks/redux';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { toastConfig } from './components/Toast';
import RecoveryNavigator from './screens/Recovery/RecoveryNavigator';
import RestoringScreen from './screens/Onboarding/Restoring';
import AppUpdate from './screens/AppUpdate';
import AppOnboarded from './AppOnboarded';

import './utils/i18n';
import { RECOVERY_DELAY } from './utils/startup/constants';
import { themeSelector } from './store/reselect/settings';
import { walletExistsSelector } from './store/reselect/wallet';
import { requiresRemoteRestoreSelector } from './store/reselect/user';
import { availableUpdateSelector } from './store/reselect/ui';

if (Platform.OS === 'android') {
	if (UIManager.setLayoutAnimationEnabledExperimental) {
		UIManager.setLayoutAnimationEnabledExperimental(true);
	}
}

const App = (): ReactElement => {
	const [tapCount, setTapCount] = useState(0);
	const [isListening, setIsListening] = useState(true);
	const theme = useAppSelector(themeSelector);
	const walletExists = useAppSelector(walletExistsSelector);
	const requiresRemoteRestore = useAppSelector(requiresRemoteRestoreSelector);
	const updateInfo = useAppSelector(availableUpdateSelector);

	// on App start
	useEffect(() => {
		// hide splash screen on android
		if (Platform.OS === 'android') {
			setTimeout(NativeModules.SplashScreenModule.hide, 100);
		}

		// check for Bitkit update
		checkForAppUpdate();

		// Tap twice anywhere in the first 500ms of startup to enter recovery
		setTimeout((): void => setIsListening(false), RECOVERY_DELAY);
	}, []);

	const onAppPress = useCallback(() => {
		if (isListening) {
			setTapCount((prevState) => prevState + 1);
		}
	}, [isListening]);

	const RootComponent = useCallback((): ReactElement => {
		if (tapCount >= 2) {
			return <RecoveryNavigator />;
		}

		if (updateInfo?.critical) {
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
	}, [tapCount, updateInfo?.critical, walletExists, requiresRemoteRestore]);

	const currentTheme = useMemo(() => getTheme(theme), [theme]);

	return (
		<ThemeProvider theme={currentTheme}>
			<SafeAreaProvider>
				<StatusBar />
				<Pressable style={styles.tapListener} onPress={onAppPress} />
				<RootComponent />
				<Toast config={toastConfig} />
			</SafeAreaProvider>
		</ThemeProvider>
	);
};

const styles = StyleSheet.create({
	tapListener: {
		...StyleSheet.absoluteFillObject,
		flex: 1,
	},
});

export default memo(App);
