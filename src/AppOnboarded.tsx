import React, { memo, ReactElement } from 'react';
import InactivityTracker from './components/InactivityTracker';
import { useAppStateHandler } from './hooks/useAppStateHandler';
import { useNetworkConnectivity } from './hooks/useNetworkConnectivity';
import { useWalletStartup } from './hooks/useWalletStartup';
import DrawerNavigator from './navigation/root/DrawerNavigator';
import RootNavigationContainer from './navigation/root/RootNavigationContainer';

const AppOnboarded = (): ReactElement => {
	useWalletStartup();
	useAppStateHandler();
	useNetworkConnectivity();

	return (
		<InactivityTracker>
			<RootNavigationContainer>
				<DrawerNavigator />
			</RootNavigationContainer>
		</InactivityTracker>
	);
};

export default memo(AppOnboarded);
