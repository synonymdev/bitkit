import React, { ReactElement, useEffect } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import TermsOfUse from '../../screens/Onboarding/TermsOfUse';
import WelcomeScreen from '../../screens/Onboarding/Welcome';
import SlideshowScreen from '../../screens/Onboarding/Slideshow';
import RestoreFromSeed from '../../screens/Onboarding/RestoreFromSeed';
import MultipleDevices from '../../screens/Onboarding/MultipleDevices';
import Passphrase from '../../screens/Onboarding/Passphrase';
import { NavigationContainer } from '../../styles/components';
import { connectToElectrum } from '../../utils/wallet/electrum';
import { selectedNetworkSelector } from '../../store/reselect/wallet';

export type OnboardingNavigationProp =
	NativeStackNavigationProp<OnboardingStackParamList>;

export type OnboardingStackParamList = {
	TermsOfUse: undefined;
	Welcome: undefined;
	Slideshow: { skipIntro?: boolean; bip39Passphrase?: string } | undefined;
	RestoreFromSeed: undefined;
	MultipleDevices: undefined;
	Passphrase: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const navOptionHandler = {
	headerShown: false,
	detachPreviousScreen: false,
};

const OnboardingNavigator = (): ReactElement => {
	const selectedNetwork = useSelector(selectedNetworkSelector);

	useEffect(() => {
		connectToElectrum({ selectedNetwork });
	}, [selectedNetwork]);

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
					name="MultipleDevices"
					component={MultipleDevices}
					options={navOptionHandler}
				/>
				<Stack.Screen
					name="RestoreFromSeed"
					component={RestoreFromSeed}
					options={navOptionHandler}
				/>
				<Stack.Screen
					name="Passphrase"
					component={Passphrase}
					options={navOptionHandler}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default OnboardingNavigator;
