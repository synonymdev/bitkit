import React, { memo, ReactElement, useEffect, useRef } from 'react';
import { Platform, NativeModules, AppState } from 'react-native';
import { useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

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
import { getStore } from './store/helpers';
import { isOnlineSelector } from './store/reselect/ui';
import {
	showErrorNotification,
	showSuccessNotification,
} from './utils/notifications';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from './store/reselect/wallet';
import i18n from './utils/i18n';

const onElectrumConnectionChange = (isConnected: boolean): void => {
	// get state fresh from store everytime
	const { isConnectedToElectrum } = getStore().ui;

	if (!isConnectedToElectrum && isConnected) {
		updateUi({ isConnectedToElectrum: isConnected });
		showSuccessNotification({
			title: i18n.t('other:connection_restored_title'),
			message: i18n.t('other:connection_restored_message'),
		});
	}

	if (isConnectedToElectrum && !isConnected) {
		updateUi({ isConnectedToElectrum: isConnected });
		showErrorNotification({
			title: i18n.t('other:connection_reconnect_title'),
			message: i18n.t('other:connection_reconnect_msg'),
		});
	}
};

const AppOnboarded = (): ReactElement => {
	const { t } = useTranslation('other');
	const appState = useRef(AppState.currentState);
	const sdk = useSlashtagsSDK();
	const { satoshis: onChainBalance } = useBalance({ onchain: true });
	const { satoshis: lightningBalance } = useBalance({ lightning: true });
	const enableAutoReadClipboard = useSelector(enableAutoReadClipboardSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const isOnline = useSelector(isOnlineSelector);

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
		let electrumSubscription = electrumConnection.subscribe(
			onElectrumConnectionChange,
		);

		// on AppState change
		const appStateSubscription = AppState.addEventListener(
			'change',
			(nextAppState) => {
				// on App to foreground
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === 'active'
				) {
					// resubscribe to electrum connection changes
					electrumSubscription = electrumConnection.subscribe(
						onElectrumConnectionChange,
					);

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
				if (
					appState.current.match(/active|inactive/) &&
					nextAppState === 'background'
				) {
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
						title: t('connection_back_title'),
						message: t('connection_back_msg'),
					});
				}
				updateUi({ isOnline: true });
			} else {
				showErrorNotification({
					title: t('connection_issue'),
					message: t('connection_issue_explain'),
				});
				updateUi({ isOnline: false });
			}
		});

		return () => {
			unsubscribeNetInfo();
		};
	}, [isOnline, t]);

	return <RootNavigator />;
};

export default memo(AppOnboarded);
