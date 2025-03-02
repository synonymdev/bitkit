import React, { memo, ReactElement } from 'react';
import InactivityTracker from './components/InactivityTracker';
import { useAppStateHandler } from './hooks/useAppStateHandler';
import { useNetworkConnectivity } from './hooks/useNetworkConnectivity';
import { useWalletStartup } from './hooks/useWalletStartup';
import DrawerNavigator from './navigation/root/DrawerNavigator';

const AppOnboarded = (): ReactElement => {
	useWalletStartup();
	useAppStateHandler();
	useNetworkConnectivity();

	return (
		<InactivityTracker>
			<DrawerNavigator />
		</InactivityTracker>
	);
};

export default memo(AppOnboarded);
