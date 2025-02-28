import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement } from 'react';

import TabBar from '../../components/TabBar';
import { __E2E__ } from '../../constants/env';
import ActivityFiltered from '../../screens/Activity/ActivityFiltered';
import ActivitySavings from '../../screens/Activity/ActivitySavings';
import ActivitySpending from '../../screens/Activity/ActivitySpending';
import Home from '../../screens/Wallets/Home';
import type { RootStackScreenProps } from '../types';

export type WalletStackParamList = {
	Home: undefined;
	ActivitySavings: undefined;
	ActivitySpending: undefined;
	ActivityFiltered: undefined;
};

export type WalletNavigationProp =
	NativeStackNavigationProp<WalletStackParamList>;

const Stack = createNativeStackNavigator<WalletStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const WalletStack = ({
	navigation,
}: RootStackScreenProps<'Wallet'>): ReactElement => {
	return (
		<>
			<Stack.Navigator screenOptions={screenOptions}>
				<Stack.Screen name="Home" component={Home} />
				<Stack.Screen name="ActivitySavings" component={ActivitySavings} />
				<Stack.Screen name="ActivitySpending" component={ActivitySpending} />
				<Stack.Screen name="ActivityFiltered" component={ActivityFiltered} />
			</Stack.Navigator>

			{/* TabBar should be visible on all of the above screens */}
			<TabBar navigation={navigation} />
		</>
	);
};

export default WalletStack;
