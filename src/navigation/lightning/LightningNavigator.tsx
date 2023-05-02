import React, { ReactElement } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import Introduction from '../../screens/Lightning/Introduction';
import CustomSetup from '../../screens/Lightning/CustomSetup';
import CustomConfirm from '../../screens/Lightning/CustomConfirm';
import Result from '../../screens/Lightning/Result';
import QuickSetup from '../../screens/Lightning/QuickSetup';
import QuickConfirm from '../../screens/Lightning/QuickConfirm';

export type LightningNavigationProp =
	NativeStackNavigationProp<LightningStackParamList>;

export type LightningStackParamList = {
	Introduction: undefined;
	QuickSetup: undefined;
	QuickConfirm: {
		spendingAmount: number;
		orderId: string;
	};
	CustomSetup: {
		spending: boolean;
		spendingAmount?: number;
	};
	CustomConfirm: {
		spendingAmount: number;
		receivingAmount: number;
		orderId: string;
	};
	Result: undefined;
};

const Stack = createNativeStackNavigator<LightningStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
};

const LightningStack = (): ReactElement => {
	return (
		<Stack.Navigator
			screenOptions={screenOptions}
			initialRouteName="Introduction">
			<Stack.Screen name="Introduction" component={Introduction} />
			<Stack.Screen name="QuickSetup" component={QuickSetup} />
			<Stack.Screen name="QuickConfirm" component={QuickConfirm} />
			<Stack.Screen name="CustomSetup" component={CustomSetup} />
			<Stack.Screen name="CustomConfirm" component={CustomConfirm} />
			<Stack.Screen name="Result" component={Result} />
		</Stack.Navigator>
	);
};

export default LightningStack;
