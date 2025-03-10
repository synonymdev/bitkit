import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import React, { memo, ReactElement } from 'react';

import InactivityTracker from './components/InactivityTracker';
import { SlashtagsProvider } from './components/SlashtagsProvider';
import { useAppStateHandler } from './hooks/useAppStateHandler';
import { useNetworkConnectivity } from './hooks/useNetworkConnectivity';
import { useWalletStartup } from './hooks/useWalletStartup';
import { SheetRefsProvider } from './navigation/bottom-sheet/SheetRefsProvider';
import DrawerNavigator from './navigation/root/DrawerNavigator';
import RootNavigationContainer from './navigation/root/RootNavigationContainer';

const AppOnboarded = (): ReactElement => {
	useWalletStartup();
	useAppStateHandler();
	useNetworkConnectivity();

	return (
		<SlashtagsProvider>
			<SheetRefsProvider>
				<InactivityTracker>
					<RootNavigationContainer>
						<BottomSheetModalProvider>
							<DrawerNavigator />
						</BottomSheetModalProvider>
					</RootNavigationContainer>
				</InactivityTracker>
			</SheetRefsProvider>
		</SlashtagsProvider>
	);
};

export default memo(AppOnboarded);
