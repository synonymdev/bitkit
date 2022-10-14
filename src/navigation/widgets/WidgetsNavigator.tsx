import React, { ReactElement } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import { NavigationContainer } from '../../styles/components';
import {
	GoodbyePasswords,
	HelloWidgets,
} from '../../screens/Widgets/WidgetsOnboarding';
import WidgetsSuggetsions from '../../screens/Widgets/WidgetsSuggestions';
import Store from '../../store/types';
import { useSelector } from 'react-redux';

export type WidgetsNavigationProp =
	NativeStackNavigationProp<WidgetsStackParamList>;

export type WidgetsStackParamList = {
	GoodbyePasswods: undefined;
	HelloWidgets: undefined;
	WidgetsSuggestions: undefined;
};

const Stack = createNativeStackNavigator<WidgetsStackParamList>();

const navOptionHandler = {
	headerShown: false,
	gestureEnabled: true,
	detachPreviousScreen: false,
};

const WidgetsNavigator = (): ReactElement => {
	const onboardedWidgets = useSelector(
		(state: Store) => state.widgets?.onboardedWidgets,
	);

	return (
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName={
					onboardedWidgets ? 'WidgetsSuggestions' : 'GoodbyePasswods'
				}>
				<Stack.Screen
					name="GoodbyePasswods"
					component={GoodbyePasswords}
					options={navOptionHandler}
				/>
				<Stack.Screen
					name="HelloWidgets"
					component={HelloWidgets}
					options={navOptionHandler}
				/>
				<Stack.Screen
					name="WidgetsSuggestions"
					component={WidgetsSuggetsions}
					options={navOptionHandler}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default WidgetsNavigator;
