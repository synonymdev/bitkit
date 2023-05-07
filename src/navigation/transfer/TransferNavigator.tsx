import React, { ReactElement } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import Setup from '../../screens/Transfer/Setup';
import Confirm from '../../screens/Transfer/Confirm';
import Availability from '../../screens/Transfer/Availability';
import Success from '../../screens/Transfer/Success';
import Interrupted from '../../screens/Transfer/Interrupted';
import { __DISABLE_ANIMATION__ } from '../../constants/env';

export type LightningNavigationProp =
	NativeStackNavigationProp<TransferStackParamList>;

export type TransferStackParamList = {
	Setup: undefined;
	Confirm: {
		spendingAmount: number;
		orderId?: string;
	};
	Availability: undefined;
	Success: { type: 'savings' | 'spending' };
	Interrupted: undefined;
};

const Stack = createNativeStackNavigator<TransferStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	...(__DISABLE_ANIMATION__ ? { animationDuration: 0 } : {}),
};

const TransferStack = (): ReactElement => {
	return (
		<Stack.Navigator screenOptions={screenOptions} initialRouteName="Setup">
			<Stack.Screen name="Setup" component={Setup} />
			<Stack.Screen name="Confirm" component={Confirm} />
			<Stack.Screen name="Availability" component={Availability} />
			<Stack.Screen name="Success" component={Success} />
			<Stack.Screen name="Interrupted" component={Interrupted} />
		</Stack.Navigator>
	);
};

export default TransferStack;
