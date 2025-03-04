import {
	DrawerNavigationProp,
	createDrawerNavigator,
} from '@react-navigation/drawer';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { ReactElement } from 'react';
import { Platform } from 'react-native';

import { RootStackParamList } from '../types';
import DrawerContent from './DrawerContent';
import RootNavigator from './RootNavigator';

const Drawer = createDrawerNavigator();

export type DrawerStackNavigationProp = CompositeNavigationProp<
	DrawerNavigationProp<{ RootStack: undefined }>,
	NativeStackNavigationProp<RootStackParamList>
>;

const DrawerNavigator = (): ReactElement => {
	const isAndroid = Platform.OS === 'android';

	return (
		<Drawer.Navigator
			drawerContent={(props) => <DrawerContent {...props} />}
			screenOptions={{
				headerShown: false,
				drawerStyle: { width: 200 },
				drawerPosition: 'right',
				drawerType: 'front',
				overlayColor: 'rgba(0,0,0,0.6)',
				// Swipe is not working properly on Android
				// TODO: Fix this
				swipeEnabled: !isAndroid,
			}}>
			<Drawer.Screen name="RootStack" component={RootNavigator} />
		</Drawer.Navigator>
	);
};

export default DrawerNavigator;
