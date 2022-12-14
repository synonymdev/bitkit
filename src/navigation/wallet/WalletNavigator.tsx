import React, { ReactElement } from 'react';
import {
	createStackNavigator,
	StackNavigationOptions,
	TransitionPresets,
} from '@react-navigation/stack';

import { TAssetType } from '../../store/types/wallet';
import WalletsScreen from '../../screens/Wallets';
import WalletsDetail from '../../screens/Wallets/WalletsDetail';
import ActivityFiltered from '../../screens/Activity/ActivityFiltered';
import AuthCheck from '../../components/AuthCheck';
import TabBar from '../../components/TabBar';
import type { RootStackScreenProps } from '../types';

export type WalletStackParamList = {
	AuthCheck: { onSuccess: () => void };
	Wallets: undefined;
	WalletsDetail: { assetType: TAssetType };
	ActivityFiltered: undefined;
};

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
	return (
		<>
			<Stack.Navigator initialRouteName="Wallets" screenOptions={navOptions}>
				<Stack.Group screenOptions={modalOptions}>
					<Stack.Screen name="AuthCheck" component={AuthCheck} />
				</Stack.Group>
				<Stack.Group screenOptions={screenOptions}>
					<Stack.Screen name="Wallets" component={WalletsScreen} />
					<Stack.Screen name="WalletsDetail" component={WalletsDetail} />
					<Stack.Screen name="ActivityFiltered" component={ActivityFiltered} />
				</Stack.Group>
			</Stack.Navigator>
			<TabBar navigation={navigation} />
		</>
	);
};

export default WalletsStack;
