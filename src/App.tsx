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
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

import { ThemeProvider } from 'styled-components/native';
import { SafeAreaProvider } from './styles/components';
import { StatusBar } from './styles/components';
import RootNavigator from './navigation/root/RootNavigator';
import Store from './store/types';
import { updateUser } from './store/actions/user';
import themes from './styles/themes';
import './utils/translations';
import OnboardingNavigator from './navigation/onboarding/OnboardingNavigator';
import { checkWalletExists, startWalletServices } from './utils/startup';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { electrumConnection } from './utils/electrum';
import {
	showErrorNotification,
	showSuccessNotification,
} from './utils/notifications';
import { toastConfig } from './components/Toast';

if (Platform.OS === 'android') {
	if (UIManager.setLayoutAnimationEnabledExperimental) {
		UIManager.setLayoutAnimationEnabledExperimental(true);
	}
}

const App = (): ReactElement => {
	const isOnline = useSelector((state: Store) => state.user.isOnline);
	const walletExists = useSelector((state: Store) => state.wallet.walletExists);
	const theme = useSelector((state: Store) => state.settings.theme);

	useEffect(() => {
		// hide spash screen on android
		if (Platform.OS === 'android') {
			setTimeout(NativeModules.SplashScreenModule.hide, 100);
		}

		// launch wallet services
		(async (): Promise<void> => {
			const _walletExists = await checkWalletExists();
			if (_walletExists) {
				await startWalletServices({});
			}
		})();

		const unsubscribeElectrum = electrumConnection.subscribe((isConnected) => {
			if (isConnected) {
				updateUser({ isConnectedToElectrum: isConnected });
				showSuccessNotification({
					title: 'Electrum Server Reconnected',
					message: 'Successfully reconnected to Electrum Server.',
				});
			} else {
				updateUser({ isConnectedToElectrum: isConnected });
				showErrorNotification({
					title: 'Electrum Connectivity Issues',
					message: 'Lost connection to server, trying to reconnect...',
				});
			}
		});

		return () => {
			unsubscribeElectrum();
		};
	}, []);

	useEffect(() => {
		// subscribe to connection information
		const unsubscribeNetInfo = NetInfo.addEventListener(({ isConnected }) => {
			if (isConnected) {
				// prevent toast from showing on startup
				if (isOnline !== isConnected) {
					showSuccessNotification({
						title: 'You’re Back Online!',
						message: 'Successfully reconnected to the Internet.',
					});
				}
				updateUser({ isOnline: isConnected });
			} else {
				showErrorNotification({
					title: 'Internet Connectivity Issues',
					message: 'Please check your network connection.',
				});
				updateUser({ isOnline: isConnected });
			}
		});

		return () => {
			unsubscribeNetInfo();
		};
	}, [isOnline]);

	const currentTheme = useMemo(() => {
		return themes[theme];
	}, [theme]);

	const RootComponent = useCallback((): ReactElement => {
		return walletExists ? (
			<SlashtagsProvider>
				<RootNavigator />
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
