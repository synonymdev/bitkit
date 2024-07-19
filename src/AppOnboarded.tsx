import React, { memo, ReactElement, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

import RootNavigator from './navigation/root/RootNavigator';
import InactivityTracker from './components/InactivityTracker';
import { startWalletServices } from './utils/startup';
import { unsubscribeFromLightningSubscriptions } from './utils/lightning';
import { useAppSelector } from './hooks/redux';
import { dispatch } from './store/helpers';
import { updateUi } from './store/slices/ui';
import { isOnlineSelector } from './store/reselect/ui';
import {
	hideBalanceOnOpenSelector,
	pinOnLaunchSelector,
	pinSelector,
} from './store/reselect/settings';
import { showToast } from './utils/notifications';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from './store/reselect/wallet';
import { updateSettings } from './store/slices/settings';
import {
	getCustomElectrumPeers,
	getOnChainWalletElectrum,
} from './utils/wallet';
import { connectToElectrum } from './utils/wallet/electrum';
// import { updateExchangeRates } from './store/actions/wallet';

const electrum = getOnChainWalletElectrum();

const AppOnboarded = (): ReactElement => {
	const { t } = useTranslation('other');
	const appState = useRef(AppState.currentState);
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const hideBalanceOnOpen = useAppSelector(hideBalanceOnOpenSelector);
	const pin = useAppSelector(pinSelector);
	const pinOnLaunch = useAppSelector(pinOnLaunchSelector);
	const isOnline = useAppSelector(isOnlineSelector);

	// on App start
	useEffect(() => {
		startWalletServices({ selectedNetwork, selectedWallet });

		const needsAuth = pin && pinOnLaunch;
		dispatch(updateUi({ isAuthenticated: !needsAuth }));

		if (hideBalanceOnOpen) {
			dispatch(updateSettings({ hideBalance: true }));
		}

		return (): void => {
			unsubscribeFromLightningSubscriptions();
		};
		// onMount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		// on AppState change
		const appStateSubscription = AppState.addEventListener(
			'change',
			(nextAppState) => {
				// on App to foreground
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === 'active'
				) {
					const customPeers = getCustomElectrumPeers({ selectedNetwork });
					// resubscribe to electrum connection changes
					connectToElectrum({
						selectedNetwork,
						customPeers,
						showNotification: false,
					}).then(() => {
						electrum?.startConnectionPolling();
					});
				}

				// on App to background
				if (
					appState.current.match(/active|inactive/) &&
					nextAppState === 'background'
				) {
					electrum?.disconnect();
				}

				appState.current = nextAppState;
			},
		);

		return (): void => {
			appStateSubscription.remove();
		};
		// onMount
	}, [selectedNetwork]);

	useEffect(() => {
		// subscribe to connection information
		const unsubscribeNetInfo = NetInfo.addEventListener(({ isConnected }) => {
			if (isConnected) {
				// prevent toast from showing on startup
				if (isOnline !== isConnected) {
					showToast({
						type: 'success',
						title: t('connection_back_title'),
						description: t('connection_back_msg'),
					});
				}
				dispatch(updateUi({ isOnline: true }));
				// FIXME: this runs too often
				// updateExchangeRates();
			} else {
				showToast({
					type: 'warning',
					title: t('connection_issue'),
					description: t('connection_issue_explain'),
				});
				dispatch(updateUi({ isOnline: false }));
			}
		});

		return (): void => {
			unsubscribeNetInfo();
		};
	}, [isOnline, t]);

	return (
		<InactivityTracker>
			<RootNavigator />
		</InactivityTracker>
	);
};

export default memo(AppOnboarded);
