import { useEffect } from 'react';
import { dispatch } from '../store/helpers';
import {
	hideBalanceOnOpenSelector,
	pinOnLaunchSelector,
	pinSelector,
} from '../store/reselect/settings';
import { updateSettings } from '../store/slices/settings';
import { updateUi } from '../store/slices/ui';
import { unsubscribeFromLightningSubscriptions } from '../utils/lightning';
import { startWalletServices } from '../utils/startup';
import { useAppSelector } from './redux';

export const useWalletStartup = (): void => {
	const hideBalanceOnOpen = useAppSelector(hideBalanceOnOpenSelector);
	const pinEnabled = useAppSelector(pinSelector);
	const pinOnLaunch = useAppSelector(pinOnLaunchSelector);

	// biome-ignore lint/correctness/useExhaustiveDependencies: onMount
	useEffect(() => {
		startWalletServices();

		const needsAuth = pinEnabled && pinOnLaunch;
		dispatch(updateUi({ isAuthenticated: !needsAuth }));

		if (hideBalanceOnOpen) {
			dispatch(updateSettings({ hideBalance: true }));
		}

		return () => {
			unsubscribeFromLightningSubscriptions();
		};
	}, []);
};
