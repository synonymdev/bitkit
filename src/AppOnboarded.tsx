import React, { memo, ReactElement, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

import RootNavigator from './navigation/root/RootNavigator';
import InactivityTracker from './components/InactivityTracker';
import { showToast } from './utils/notifications';
import { startWalletServices } from './utils/startup';
import { getOnChainWalletElectrumAsync } from './utils/wallet';
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
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from './store/reselect/wallet';
import { updateSettings } from './store/slices/settings';
// import { updateExchangeRates } from './store/actions/wallet';

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
	// biome-ignore lint/correctness/useExhaustiveDependencies: onMount
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
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: onMount
	useEffect(() => {
		// on AppState change
		const appStateSubscription = AppState.addEventListener(
			'change',
			async (nextAppState) => {
				dispatch(updateUi({ appState: nextAppState }));
				const electrum = await getOnChainWalletElectrumAsync();
				// on App to foreground
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === 'active'
				) {
					// resubscribe to electrum connection changes
					electrum.startConnectionPolling();
				}

				// on App to background
				if (
					appState.current.match(/active|inactive/) &&
					nextAppState === 'background'
				) {
					electrum.stopConnectionPolling();
				}

				appState.current = nextAppState;
			},
		);

		return (): void => {
			appStateSubscription.remove();
		};
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
