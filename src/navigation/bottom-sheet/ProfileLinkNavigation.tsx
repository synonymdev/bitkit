import React, { ReactElement, memo } from 'react';
import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { NavigationContainer } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import ProfileLink from '../../screens/Profile/ProfileLink';
import ProfileLinkSuggestions from '../../screens/Profile/ProfileLinkSuggestions';
import { useAppSelector } from '../../hooks/redux';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';
import { __E2E__ } from '../../constants/env';

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
	const isOpen = useAppSelector((state) => {
		return viewControllerIsOpenSelector(state, 'profileAddDataForm');
	});

	return (
		<BottomSheetWrapper view="profileAddDataForm" snapPoints={snapPoints}>
			<NavigationIndependentTree>
				<NavigationContainer key={isOpen.toString()}>
					<Stack.Navigator screenOptions={screenOptions}>
						<Stack.Screen name="ProfileLink" component={ProfileLink} />
						<Stack.Screen
							name="ProfileLinkSuggestions"
							component={ProfileLinkSuggestions}
						/>
					</Stack.Navigator>
				</NavigationContainer>
			</NavigationIndependentTree>
		</BottomSheetWrapper>
	);
};

export default memo(ProfileLinkNavigation);
