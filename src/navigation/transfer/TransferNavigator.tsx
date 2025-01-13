import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { IBtOrder } from '@synonymdev/blocktank-lsp-http-client';
import { LNURLChannelParams } from 'js-lnurl';
import React, { ReactElement } from 'react';

import { __E2E__ } from '../../constants/env';
import Availability from '../../screens/Transfer/Availability';
import ExternalAmount from '../../screens/Transfer/ExternalNode/Amount';
import ExternalConfirm from '../../screens/Transfer/ExternalNode/Confirm';
import ExternalConnection from '../../screens/Transfer/ExternalNode/Connection';
import ExternalFeeCustom from '../../screens/Transfer/ExternalNode/FeeCustom';
import ExternalSuccess from '../../screens/Transfer/ExternalNode/Success';
import Funding from '../../screens/Transfer/Funding';
import FundingAdvanced from '../../screens/Transfer/FundingAdvanced';
import Interrupted from '../../screens/Transfer/Interrupted';
import LNURLChannel from '../../screens/Transfer/LNURLChannel';
import Liquidity from '../../screens/Transfer/Liquidity';
import SavingsAdvanced from '../../screens/Transfer/SavingsAdvanced';
import SavingsConfirm from '../../screens/Transfer/SavingsConfirm';
import SavingsIntro from '../../screens/Transfer/SavingsIntro';
import SavingsProgress from '../../screens/Transfer/SavingsProgress';
import SettingUp from '../../screens/Transfer/SettingUp';
import SpendingAdvanced from '../../screens/Transfer/SpendingAdvanced';
import SpendingAmount from '../../screens/Transfer/SpendingAmount';
import SpendingConfirm from '../../screens/Transfer/SpendingConfirm';
import SpendingIntro from '../../screens/Transfer/SpendingIntro';
import Success from '../../screens/Transfer/Success';
import TransferIntro from '../../screens/Transfer/TransferIntro';
import { TChannel } from '../../store/types/lightning';

export type TransferNavigationProp =
	NativeStackNavigationProp<TransferStackParamList>;

export type TransferStackParamList = {
	TransferIntro: undefined;
	Funding: undefined;
	FundingAdvanced: undefined;
	SpendingIntro: undefined;
	SpendingAmount: undefined;
	SpendingConfirm: { order: IBtOrder; advanced?: boolean };
	Liquidity: { channelSize: number; localBalance: number };
	SpendingAdvanced: { order: IBtOrder };
	SettingUp: undefined;
	Interrupted: undefined;
	Success: { type: 'spending' | 'savings' };
	LNURLChannel: { cParams: LNURLChannelParams };
	ExternalConnection: { peer: string } | undefined;
	ExternalAmount: { nodeId: string };
	ExternalConfirm: {
		nodeId: string;
		localBalance: number;
	};
	ExternalSuccess: undefined;
	SavingsIntro: undefined;
	Availability: undefined;
	SavingsConfirm: { channels: TChannel[] } | undefined;
	SavingsAdvanced: undefined;
	SavingsProgress: { channels: TChannel[] };
	ExternalFeeCustom: undefined;
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
			initialRouteName="TransferIntro">
			<Stack.Screen name="TransferIntro" component={TransferIntro} />
			<Stack.Screen name="Funding" component={Funding} />
			<Stack.Screen name="FundingAdvanced" component={FundingAdvanced} />
			<Stack.Screen name="SpendingIntro" component={SpendingIntro} />
			<Stack.Screen name="SpendingAmount" component={SpendingAmount} />
			<Stack.Screen name="SpendingConfirm" component={SpendingConfirm} />
			<Stack.Screen name="Liquidity" component={Liquidity} />
			<Stack.Screen name="SpendingAdvanced" component={SpendingAdvanced} />
			<Stack.Screen name="SettingUp" component={SettingUp} />
			<Stack.Screen name="SavingsIntro" component={SavingsIntro} />
			<Stack.Screen name="Availability" component={Availability} />
			<Stack.Screen name="SavingsConfirm" component={SavingsConfirm} />
			<Stack.Screen name="SavingsAdvanced" component={SavingsAdvanced} />
			<Stack.Screen name="SavingsProgress" component={SavingsProgress} />
			<Stack.Screen name="Interrupted" component={Interrupted} />
			<Stack.Screen name="Success" component={Success} />
			<Stack.Screen name="LNURLChannel" component={LNURLChannel} />
			<Stack.Screen name="ExternalConnection" component={ExternalConnection} />
			<Stack.Screen name="ExternalAmount" component={ExternalAmount} />
			<Stack.Screen name="ExternalConfirm" component={ExternalConfirm} />
			<Stack.Screen name="ExternalSuccess" component={ExternalSuccess} />
			<Stack.Screen name="ExternalFeeCustom" component={ExternalFeeCustom} />
		</Stack.Navigator>
	);
};

export default Transfer;
