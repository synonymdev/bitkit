import {
	DrawerNavigationProp,
	createDrawerNavigator,
} from '@react-navigation/drawer';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { ReactElement } from 'react';

import { RootStackParamList } from '../types';
import DrawerContent from './DrawerContent';
import RootNavigationContainer from './RootNavigationContainer';
import RootNavigator from './RootNavigator';

const Drawer = createDrawerNavigator();

export type DrawerStackNavigationProp = CompositeNavigationProp<
	DrawerNavigationProp<{ RootStack: undefined }>,
	NativeStackNavigationProp<RootStackParamList>
>;

const DrawerNavigator = (): ReactElement => {
	return (
		<RootNavigationContainer>
			<Drawer.Navigator
				screenOptions={{
					headerShown: false,
					drawerStyle: { width: 200 },
					drawerPosition: 'right',
					drawerType: 'front',
					overlayColor: 'rgba(0,0,0,0.6)',
				}}
				drawerContent={(props) => <DrawerContent {...props} />}>
				<Drawer.Screen name="RootStack" component={RootNavigator} />
			</Drawer.Navigator>
		</RootNavigationContainer>
	);
};

export default DrawerNavigator;
