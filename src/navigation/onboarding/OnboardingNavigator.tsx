import React, { ReactElement } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import TermsOfUse from '../../screens/Onboarding/TermsOfUse';
import WelcomeScreen from '../../screens/Onboarding/Welcome';
import SlideshowScreen from '../../screens/Onboarding/Slideshow';
import RestoreFromSeed from '../../screens/Onboarding/RestoreFromSeed';
import { NavigationContainer } from '../../styles/components';

export type OnboardingNavigationProp =
	NativeStackNavigationProp<OnboardingStackParamList>;

export type OnboardingStackParamList = {
	TermsOfUse: undefined;
	Welcome: undefined;
	Slideshow: { skipIntro?: boolean } | undefined;
	RestoreFromSeed: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const navOptionHandler = {
	headerShown: false,
	detachPreviousScreen: false,
};

const OnboardingNavigator = (): ReactElement => {
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="TermsOfUse">
				<Stack.Screen
					name="TermsOfUse"
					component={TermsOfUse}
					options={navOptionHandler}
				/>
				<Stack.Screen
					name="Welcome"
					component={WelcomeScreen}
					options={navOptionHandler}
				/>
				<Stack.Screen
					name="Slideshow"
					component={SlideshowScreen}
					options={navOptionHandler}
				/>
				<Stack.Screen
					name="RestoreFromSeed"
					component={RestoreFromSeed}
					options={navOptionHandler}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default OnboardingNavigator;
