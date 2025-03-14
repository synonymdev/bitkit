import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement, memo } from 'react';

import BottomSheet from '../components/BottomSheet';
import { __E2E__ } from '../constants/env';
import ProfileLink from '../screens/Profile/ProfileLink';
import ProfileLinkSuggestions from '../screens/Profile/ProfileLinkSuggestions';
import BottomSheetNavigationContainer from './BottomSheetNavigationContainer';

export type ProfileLinkNavigationProp =
	NativeStackNavigationProp<ProfileLinkStackParamList>;

export type ProfileLinkStackParamList = {
	ProfileLink: undefined;
	ProfileLinkSuggestions: undefined;
};

const Stack = createNativeStackNavigator<ProfileLinkStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const ProfileLinkNavigation = (): ReactElement => {
	return (
		<BottomSheet id="profileLink" size="small">
			<NavigationIndependentTree>
				<BottomSheetNavigationContainer>
					<Stack.Navigator screenOptions={screenOptions}>
						<Stack.Screen name="ProfileLink" component={ProfileLink} />
						<Stack.Screen
							name="ProfileLinkSuggestions"
							component={ProfileLinkSuggestions}
						/>
					</Stack.Navigator>
				</BottomSheetNavigationContainer>
			</NavigationIndependentTree>
		</BottomSheet>
	);
};

export default memo(ProfileLinkNavigation);
