import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { dispatch } from '../store/helpers';
import { updateUi } from '../store/slices/ui';
import { getOnChainWalletElectrumAsync } from '../utils/wallet';

export const useAppStateHandler = (): void => {
	const appState = useRef(AppState.currentState);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener(
			'change',
			async (nextAppState) => {
				dispatch(updateUi({ appState: nextAppState }));
				const electrum = await getOnChainWalletElectrumAsync();
				// App to foreground
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === 'active'
				) {
					// resubscribe to electrum connection changes
					electrum.startConnectionPolling();
				}

				// App to background
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
	}, []);
};
