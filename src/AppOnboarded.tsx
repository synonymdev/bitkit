import React, { memo, ReactElement, useEffect, useRef } from 'react';
import { Platform, NativeModules, AppState } from 'react-native';
import { useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';

import RootNavigator from './navigation/root/RootNavigator';
import { useSlashtagsSDK } from './components/SlashtagsProvider';
import { updateUi } from './store/actions/ui';
import { useBalance } from './hooks/wallet';
import { startWalletServices } from './utils/startup';
import { RECOVERY_DELAY } from './utils/startup/constants';
import { electrumConnection } from './utils/electrum';
import { readClipboardInvoice } from './utils/send';
import { unsubscribeFromLightningSubscriptions } from './utils/lightning';
import { enableAutoReadClipboardSelector } from './store/reselect/settings';
import {
	showErrorNotification,
	showSuccessNotification,
} from './utils/notifications';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from './store/reselect/wallet';
import {
	isConnectedToElectrumSelector,
	isOnlineSelector,
} from './store/reselect/ui';

const AppOnboarded = (): ReactElement => {
	const appState = useRef(AppState.currentState);
	const sdk = useSlashtagsSDK();
	const { satoshis: onChainBalance } = useBalance({ onchain: true });
	const { satoshis: lightningBalance } = useBalance({ lightning: true });
	const enableAutoReadClipboard = useSelector(enableAutoReadClipboardSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const isOnline = useSelector(isOnlineSelector);
	const isConnectedToElectrum = useSelector(isConnectedToElectrumSelector);

	// on App start
	useEffect(() => {
		// hide splash screen on android
		if (Platform.OS === 'android') {
			setTimeout(NativeModules.SplashScreenModule.hide, 100);
		}

		let timerId: NodeJS.Timeout;

		// launch wallet services
		((): void => {
			// Delay service startup to make time for entering recovery
			timerId = setTimeout(() => {
				startWalletServices({ selectedNetwork, selectedWallet });
			}, RECOVERY_DELAY);

			// check clipboard for payment data
			if (enableAutoReadClipboard) {
				// hack to wait for BottomSheet to be ready(?)
				setTimeout(() => {
					readClipboardInvoice({
						onChainBalance,
						lightningBalance,
						sdk,
						selectedWallet,
						selectedNetwork,
					});
				}, 100);
			}
		})();

		return () => {
			clearTimeout(timerId);
			unsubscribeFromLightningSubscriptions();
		};
		// onMount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const electrumSubscription = electrumConnection.subscribe((isConnected) => {
			if (!isConnectedToElectrum && isConnected) {
				updateUi({ isConnectedToElectrum: isConnected });
				showSuccessNotification({
					title: 'Bitkit Connection Restored',
					message: 'Successfully reconnected to Electrum Server.',
				});
			}

			if (isConnectedToElectrum && !isConnected) {
				updateUi({ isConnectedToElectrum: isConnected });
				showErrorNotification({
					title: 'Bitkit Is Reconnecting',
					message: 'Lost connection to server, trying to reconnect...',
				});
			}
		});

		// on AppState change
		const appStateSubscription = AppState.addEventListener(
			'change',
			(nextAppState) => {
				// on App to foreground
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === 'active'
				) {
					// check clipboard for payment data
					if (enableAutoReadClipboard) {
						// timeout needed otherwise clipboard is empty
						setTimeout(() => {
							readClipboardInvoice({
								onChainBalance,
								lightningBalance,
								sdk,
								selectedNetwork,
								selectedWallet,
							}).then();
						}, 1000);
					}
				}

				// on App to background
				if (appState.current === 'active' && nextAppState === 'background') {
					// resetLdk().then();
					electrumSubscription.remove();
				}

				appState.current = nextAppState;
			},
		);

		return () => {
			appStateSubscription.remove();
			electrumSubscription.remove();
		};
		// onMount
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
				updateUi({ isOnline: true });
			} else {
				showErrorNotification({
					title: 'Internet Connectivity Issues',
					message: 'Please check your network connection.',
				});
				updateUi({ isOnline: false });
			}
		});

		return () => {
			unsubscribeNetInfo();
		};
	}, [isOnline]);

	return <RootNavigator />;
};

export default memo(AppOnboarded);
