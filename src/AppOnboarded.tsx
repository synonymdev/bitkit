import React, { memo, ReactElement, useEffect, useRef } from 'react';
import { Platform, NativeModules, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import RootNavigator from './navigation/root/RootNavigator';
import { useSlashtagsSDK } from './components/SlashtagsProvider';
import { closeAllViews, updateUser } from './store/actions/user';
import { useAppSelector } from './hooks/redux';
import { useBalance } from './hooks/wallet';
import { startWalletServices } from './utils/startup';
import { electrumConnection } from './utils/electrum';
import { readClipboardInvoice } from './utils/send';
import {
	resetLdk,
	unsubscribeFromLightningSubscriptions,
} from './utils/lightning';
import {
	showErrorNotification,
	showSuccessNotification,
} from './utils/notifications';

const AppOnboarded = (): ReactElement => {
	const appState = useRef(AppState.currentState);
	const sdk = useSlashtagsSDK();
	const { satoshis: onChainBalance } = useBalance({ onchain: true });
	const { satoshis: lightningBalance } = useBalance({ lightning: true });
	const enableAutoReadClipboard = useAppSelector(
		(state) => state.settings.enableAutoReadClipboard,
	);
	const isOnline = useAppSelector((state) => state.user.isOnline);
	const isConnectedToElectrum = useAppSelector(
		(state) => state.user.isConnectedToElectrum,
	);

	// on App start
	useEffect(() => {
		// close all BottomSheets & Modals in case user closed the app while any were open
		closeAllViews();

		// hide splash screen on android
		if (Platform.OS === 'android') {
			setTimeout(NativeModules.SplashScreenModule.hide, 100);
		}

		// launch wallet services
		(async (): Promise<void> => {
			await startWalletServices({});

			// check clipboard for payment data
			if (enableAutoReadClipboard) {
				// hack to wait for BottomSheet to be ready(?)
				setTimeout(() => {
					readClipboardInvoice({ onChainBalance, lightningBalance, sdk });
				}, 100);
			}
		})();

		return () => {
			unsubscribeFromLightningSubscriptions();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// on AppState change
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			// on App to foreground
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				// App came back to foreground, lets restart our services
				startWalletServices({ lightning: true, onchain: false }).then();

				// check clipboard for payment data
				if (enableAutoReadClipboard) {
					// timeout needed otherwise clipboard is empty
					setTimeout(() => {
						readClipboardInvoice({
							onChainBalance,
							lightningBalance,
							sdk,
						}).then();
					}, 1000);
				}
			}

			// on App to background
			if (appState.current === 'active' && nextAppState === 'background') {
				// do something when the app goes to background
				resetLdk();
			}

			appState.current = nextAppState;
		});

		return () => {
			subscription.remove();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const unsubscribeElectrum = electrumConnection.subscribe((isConnected) => {
			if (!isConnectedToElectrum && isConnected) {
				updateUser({ isConnectedToElectrum: isConnected });
				// showSuccessNotification({
				// 	title: 'Bitkit Connection Restored',
				// 	message: 'Successfully reconnected to Electrum Server.',
				// });
			}

			if (isConnectedToElectrum && !isConnected) {
				updateUser({ isConnectedToElectrum: isConnected });
				// showErrorNotification({
				// 	title: 'Bitkit Is Reconnecting',
				// 	message: 'Lost connection to server, trying to reconnect...',
				// });
			}
		});

		return () => {
			unsubscribeElectrum();
		};
	}, [isConnectedToElectrum]);

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

	return <RootNavigator />;
};

export default memo(AppOnboarded);
