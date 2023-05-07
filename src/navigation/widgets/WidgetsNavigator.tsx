import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
	GoodbyePasswords,
	HelloWidgets,
} from '../../screens/Widgets/WidgetsOnboarding';
import WidgetsSuggestions from '../../screens/Widgets/WidgetsSuggestions';
import { onboardedWidgetsSelector } from '../../store/reselect/widgets';
import { __DISABLE_ANIMATION__ } from '../../constants/env';

export type WidgetsNavigationProp =
	NativeStackNavigationProp<WidgetsStackParamList>;

export type WidgetsStackParamList = {
	GoodbyePasswords: undefined;
	HelloWidgets: undefined;
	WidgetsSuggestions: undefined;
};

const Stack = createNativeStackNavigator<WidgetsStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	...(__DISABLE_ANIMATION__ ? { animationDuration: 0 } : {}),
};

const WidgetsNavigator = (): ReactElement => {
	const onboardedWidgets = useSelector(onboardedWidgetsSelector);

	return (
		<Stack.Navigator
			initialRouteName={
				onboardedWidgets ? 'WidgetsSuggestions' : 'GoodbyePasswords'
			}>
			<Stack.Group screenOptions={screenOptions}>
				<Stack.Screen name="GoodbyePasswords" component={GoodbyePasswords} />
				<Stack.Screen name="HelloWidgets" component={HelloWidgets} />
				<Stack.Screen
					name="WidgetsSuggestions"
					component={WidgetsSuggestions}
				/>
			</Stack.Group>
		</Stack.Navigator>
	);
};

export default WidgetsNavigator;
