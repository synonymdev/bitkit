import React, { ReactElement } from 'react';
import {
	createStackNavigator,
	StackNavigationOptions,
} from '@react-navigation/stack';

import { NavigationContainer } from '../../styles/components';
import AuthCheck from '../../components/AuthCheck';
import Recovery from '../../screens/Recovery/Recovery';
import Mnemonic from '../../screens/Recovery/Mnemonic';

export type RecoveryStackParamList = {
	AuthCheck: { onSuccess: () => void };
	Recovery: undefined;
	Mnemonic: undefined;
};

const Stack = createStackNavigator<RecoveryStackParamList>();

const screenOptions: StackNavigationOptions = {
	headerShown: false,
};

const RecoveryNavigator = (): ReactElement => {
	return (
		<NavigationContainer>
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
