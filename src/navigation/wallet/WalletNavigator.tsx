import React, { ReactElement, useState } from 'react';
import {
	createStackNavigator,
	StackNavigationOptions,
	StackNavigationProp,
	TransitionPresets,
} from '@react-navigation/stack';

import { TAssetType } from '../../store/types/wallet';
import WalletsScreen from '../../screens/Wallets';
import WalletsDetail from '../../screens/Wallets/WalletsDetail';
import ActivityFiltered from '../../screens/Activity/ActivityFiltered';
import BackupPrompt from '../../screens/Settings/Backup/BackupPrompt';
import AppUpdatePrompt from '../bottom-sheet/AppUpdatePrompt';
import HighBalanceWarning from '../bottom-sheet/HighBalanceWarning';
import AuthCheck from '../../components/AuthCheck';
import TabBar from '../../components/TabBar';
import type { RootStackScreenProps } from '../types';

export type WalletStackParamList = {
	AuthCheck: { onSuccess: () => void };
	Wallets: { onFocus: (focused: boolean) => void };
	WalletsDetail: { assetType: TAssetType };
	ActivityFiltered: undefined;
};

export type WalletNavigationProp = StackNavigationProp<WalletStackParamList>;

const Stack = createStackNavigator<WalletStackParamList>();
const navOptions: StackNavigationOptions = { headerShown: false };
const modalOptions = navOptions;
const screenOptions: StackNavigationOptions = {
	...navOptions,
	...TransitionPresets.SlideFromRightIOS,
};

const WalletsStack = ({
	navigation,
}: RootStackScreenProps<'Wallet'>): ReactElement => {
	const [isWalletsScreenFocused, setIsFocused] = useState(false);

	return (
		<>
			<Stack.Navigator initialRouteName="Wallets" screenOptions={navOptions}>
				<Stack.Group screenOptions={modalOptions}>
					<Stack.Screen name="AuthCheck" component={AuthCheck} />
				</Stack.Group>
				<Stack.Group screenOptions={screenOptions}>
					<Stack.Screen
						name="Wallets"
						component={WalletsScreen}
						initialParams={{ onFocus: setIsFocused }}
					/>
					<Stack.Screen name="WalletsDetail" component={WalletsDetail} />
					<Stack.Screen name="ActivityFiltered" component={ActivityFiltered} />
				</Stack.Group>
			</Stack.Navigator>

			<TabBar navigation={navigation} />

			{/* only render these when 'Wallets' screen is in focus so timers run correctly */}
			{isWalletsScreenFocused && (
				<>
					<BackupPrompt />
					<HighBalanceWarning />
					<AppUpdatePrompt />
				</>
			)}
		</>
	);
};

export default WalletsStack;
