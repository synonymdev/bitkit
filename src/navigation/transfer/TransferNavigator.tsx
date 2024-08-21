import React, { ReactElement } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { LNURLChannelParams } from 'js-lnurl';

import Introduction from '../../screens/Transfer/Introduction';
import Funding from '../../screens/Transfer/Funding';
import QuickSetup from '../../screens/Transfer/QuickSetup';
import QuickConfirm from '../../screens/Transfer/QuickConfirm';
import CustomSetup from '../../screens/Transfer/CustomSetup';
import CustomConfirm from '../../screens/Transfer/CustomConfirm';
import SettingUp from '../../screens/Transfer/SettingUp';
import Availability from '../../screens/Transfer/Availability';
import Interrupted from '../../screens/Transfer/Interrupted';
import Success from '../../screens/Transfer/Success';
import LNURLChannel from '../../screens/Transfer/LNURLChannel';
import LNURLChannelSuccess from '../../screens/Transfer/LNURLChannelSuccess';
import { __E2E__ } from '../../constants/env';
import { EUnit } from '../../store/types/wallet';

export type TransferNavigationProp =
	NativeStackNavigationProp<TransferStackParamList>;

export type TransferStackParamList = {
	Introduction: undefined;
	Funding: undefined;
	QuickSetup: undefined;
	QuickConfirm: {
		spendingAmount: number;
		orderId?: string;
		onChangeUnitOutside: (nextUnit: EUnit) => void;
	};
	CustomSetup: { spending: boolean; spendingAmount?: number };
	CustomConfirm: {
		spendingAmount: number;
		receivingAmount: number;
		orderId: string;
	};
	SettingUp: undefined;
	Availability: undefined;
	Interrupted: undefined;
	Success: { type: 'spending' | 'savings' };
	LNURLChannel: { cParams: LNURLChannelParams };
	LNURLChannelSuccess: undefined;
};

const Stack = createNativeStackNavigator<TransferStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const Transfer = (): ReactElement => {
	return (
		<Stack.Navigator
			screenOptions={screenOptions}
			initialRouteName="Introduction">
			<Stack.Screen name="Introduction" component={Introduction} />
			<Stack.Screen name="Funding" component={Funding} />
			<Stack.Screen name="QuickSetup" component={QuickSetup} />
			<Stack.Screen name="QuickConfirm" component={QuickConfirm} />
			<Stack.Screen name="CustomSetup" component={CustomSetup} />
			<Stack.Screen name="CustomConfirm" component={CustomConfirm} />
			<Stack.Screen name="SettingUp" component={SettingUp} />
			<Stack.Screen name="Availability" component={Availability} />
			<Stack.Screen name="Interrupted" component={Interrupted} />
			<Stack.Screen name="Success" component={Success} />
			<Stack.Screen name="LNURLChannel" component={LNURLChannel} />
			<Stack.Screen
				name="LNURLChannelSuccess"
				component={LNURLChannelSuccess}
			/>
		</Stack.Navigator>
	);
};

export default Transfer;
