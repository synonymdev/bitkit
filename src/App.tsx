import React, {
	memo,
	ReactElement,
	useMemo,
	useEffect,
	useCallback,
	useState,
} from 'react';
import { Platform, UIManager, NativeModules, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from 'styled-components/native';

import { SafeAreaProvider, StatusBar, View } from './styles/components';
import { getTheme } from './styles/themes';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import TwoFingerPressable from './components/TwoFingerPressable';
import { toastConfig } from './components/Toast';
import RecoveryNavigator from './screens/Recovery/RecoveryNavigator';
import RestoringScreen from './screens/Onboarding/Restoring';
import AppUpdate from './screens/AppUpdate';
import AppOnboarded from './AppOnboarded';

import './utils/i18n';
import { checkForAppUpdate } from './store/actions/ui';
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
	const [isListening, setIsListening] = useState(true);
	const [showRecovery, setShowRecovery] = useState(false);
	const theme = useSelector(themeSelector);
	const walletExists = useSelector(walletExistsSelector);
	const updateInfo = useSelector(availableUpdateSelector);
	const requiresRemoteRestore = useSelector(requiresRemoteRestoreSelector);

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

	const onTwoFingerPress = useCallback(() => {
		if (isListening) {
			setShowRecovery(true);
			setIsListening(false);
		}
	}, [isListening]);

	const RootComponent = useCallback((): ReactElement => {
		if (showRecovery) {
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
	}, [showRecovery, updateInfo?.critical, walletExists, requiresRemoteRestore]);

	const currentTheme = useMemo(() => getTheme(theme), [theme]);

	return (
		<ThemeProvider theme={currentTheme}>
			<SafeAreaProvider>
				<StatusBar />
				<TwoFingerPressable onGesture={onTwoFingerPress}>
					<View style={[styles.tapListener, !isListening && styles.hide]} />
				</TwoFingerPressable>
				<RootComponent />
				<Toast config={toastConfig} />
			</SafeAreaProvider>
		</ThemeProvider>
	);
};

const styles = StyleSheet.create({
	tapListener: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'transparent',
		flex: 1,
		zIndex: 1,
	},
	hide: {
		zIndex: -1,
	},
});

export default memo(App);
