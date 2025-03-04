import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement } from 'react';

import AuthCheck from '../../components/AuthCheck';
import { __E2E__ } from '../../constants/env';
import Mnemonic from '../../screens/Recovery/Mnemonic';
import Recovery from '../../screens/Recovery/Recovery';

export type RecoveryStackParamList = {
	AuthCheck: { onSuccess: () => void };
	Recovery: undefined;
	Mnemonic: undefined;
};

const Stack = createNativeStackNavigator<RecoveryStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const RecoveryNavigator = (): ReactElement => {
	return (
		<NavigationContainer theme={DarkTheme}>
			<Stack.Navigator
				screenOptions={screenOptions}
				initialRouteName="Recovery">
				<Stack.Screen name="AuthCheck" component={AuthCheck} />
				<Stack.Screen name="Recovery" component={Recovery} />
				<Stack.Screen name="Mnemonic" component={Mnemonic} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default RecoveryNavigator;
