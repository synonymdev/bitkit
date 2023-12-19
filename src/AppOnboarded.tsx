import React, { memo, ReactElement, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

import RootNavigator from './navigation/root/RootNavigator';
import InactivityTracker from './components/InactivityTracker';
import { startWalletServices } from './utils/startup';
import { unsubscribeFromLightningSubscriptions } from './utils/lightning';
import { updateUi } from './store/actions/ui';
import { isOnlineSelector } from './store/reselect/ui';
import { pinOnLaunchSelector, pinSelector } from './store/reselect/settings';
import { showToast } from './utils/notifications';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from './store/reselect/wallet';
import { useMigrateSlashtags2 } from './hooks/slashtags2';
import {
	getCustomElectrumPeers,
	getOnChainWalletElectrum,
} from './utils/wallet';
import { EAvailableNetworks } from 'beignet';

const electrum = getOnChainWalletElectrum();

const AppOnboarded = (): ReactElement => {
	const { t } = useTranslation('other');
	const appState = useRef(AppState.currentState);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const pin = useSelector(pinSelector);
	const pinOnLaunch = useSelector(pinOnLaunchSelector);
	const isOnline = useSelector(isOnlineSelector);

	// migrate slashtags from v1 to v2
	useMigrateSlashtags2();

	// on App start
	useEffect(() => {
		startWalletServices({ selectedNetwork, selectedWallet });

		const needsAuth = pin && pinOnLaunch;
		updateUi({ isAuthenticated: !needsAuth });

		return () => {
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
					electrum
						?.connectToElectrum({
							network: EAvailableNetworks[selectedNetwork],
							servers: customPeers,
						})
						.then(() => {
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

		return () => {
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
				updateUi({ isOnline: true });
			} else {
				showToast({
					type: 'error',
					title: t('connection_issue'),
					description: t('connection_issue_explain'),
				});
				updateUi({ isOnline: false });
			}
		});

		return () => {
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
