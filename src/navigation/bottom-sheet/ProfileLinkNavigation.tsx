import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import ProfileAddLinkForm from '../../screens/Profile/ProfileAddLinkForm';
import ProfileLinkSuggestions from '../../screens/Profile/ProfileLinkSuggestions';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { NavigationContainer } from '../../styles/components';
import Store from '../../store/types';

export type SendNavigationProp =
	NativeStackNavigationProp<ProfileLinkStackParamList>;

export type ProfileLinkStackParamList = {
	ProfileAddLinkForm: undefined;
	ProfileLinkSuggestions: undefined;
};

const Stack = createNativeStackNavigator<ProfileLinkStackParamList>();
const navOptions: NativeStackNavigationOptions = {
	headerShown: false,
	gestureEnabled: true,
};

const ProfileLinkNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('small');
	const isOpen = useSelector(
		(store: Store) => store.user.viewController.profileAddLink.isOpen,
	);

	return (
		<BottomSheetWrapper view="profileAddLink" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen}>
				<Stack.Navigator screenOptions={navOptions}>
					<Stack.Group screenOptions={navOptions}>
						<Stack.Screen
							name="ProfileAddLinkForm"
							component={ProfileAddLinkForm}
						/>
						<Stack.Screen
							name="ProfileLinkSuggestions"
							component={ProfileLinkSuggestions}
						/>
					</Stack.Group>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(ProfileLinkNavigation);
