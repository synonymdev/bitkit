import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import { useSnapPoints } from '../../hooks/bottomSheet';
import ProfileLink from '../../screens/Profile/ProfileLink';
import ProfileLinkSuggestions from '../../screens/Profile/ProfileLinkSuggestions';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';
import { NavigationContainer } from '../../styles/components';

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
	const snapPoints = useSnapPoints('small');
	const isOpen = useSelector((state) => {
		return viewControllerIsOpenSelector(state, 'profileAddDataForm');
	});

	return (
		<BottomSheetWrapper view="profileAddDataForm" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator screenOptions={screenOptions}>
					<Stack.Screen name="ProfileLink" component={ProfileLink} />
					<Stack.Screen
						name="ProfileLinkSuggestions"
						component={ProfileLinkSuggestions}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(ProfileLinkNavigation);
