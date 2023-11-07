import React, { ReactElement } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { LNURLChannelParams } from 'js-lnurl';

import Introduction from '../../screens/Lightning/Introduction';
import CustomSetup from '../../screens/Lightning/CustomSetup';
import CustomConfirm from '../../screens/Lightning/CustomConfirm';
import QuickSetup from '../../screens/Lightning/QuickSetup';
import QuickConfirm from '../../screens/Lightning/QuickConfirm';
import SettingUp from '../../screens/Lightning/SettingUp';
import Success from '../../screens/Lightning/Success';
import Timeout from '../../screens/Lightning/Timeout';
import LNURLChannel from '../../screens/Lightning/LNURLChannel';
import LNURLChannelSuccess from '../../screens/Lightning/LNURLChannelSuccess';
import { __E2E__ } from '../../constants/env';

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
	SettingUp: undefined;
	Success: undefined;
	Timeout: undefined;
	LNURLChannel: { cParams: LNURLChannelParams };
	LNURLChannelSuccess: undefined;
};

const Stack = createNativeStackNavigator<LightningStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
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
			<Stack.Screen name="SettingUp" component={SettingUp} />
			<Stack.Screen name="Success" component={Success} />
			<Stack.Screen name="Timeout" component={Timeout} />
			<Stack.Screen name="LNURLChannel" component={LNURLChannel} />
			<Stack.Screen
				name="LNURLChannelSuccess"
				component={LNURLChannelSuccess}
			/>
		</Stack.Navigator>
	);
};

export default LightningStack;
