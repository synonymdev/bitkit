import React, { ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TermsOfUse from '../../screens/Onboarding/TermsOfUse';
import WelcomeScreen from '../../screens/Onboarding/Welcome';
import SlideshowScreen from '../../screens/Onboarding/Slideshow';
import RestoreFromSeed from '../../screens/Onboarding/RestoreFromSeed';
import MultipleDevices from '../../screens/Onboarding/MultipleDevices';
import Passphrase from '../../screens/Onboarding/Passphrase';
import CreateWallet, {
	TCreateWalletParams,
} from '../../screens/Onboarding/CreateWallet';
import { NavigationContainer } from '../../styles/components';
import { useAppSelector } from '../../hooks/redux';
import { requiresRemoteRestoreSelector } from '../../store/reselect/user';
import { walletExistsSelector } from '../../store/reselect/wallet';

export type OnboardingStackParamList = {
	TermsOfUse: undefined;
	Welcome: undefined;
	Slideshow: { skipIntro?: boolean; bip39Passphrase?: string } | undefined;
	RestoreFromSeed: undefined;
	MultipleDevices: undefined;
	Passphrase: undefined;
	CreateWallet: TCreateWalletParams;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const navOptionHandler = {
	headerShown: false,
	detachPreviousScreen: false,
};

const navOptionHandlerNoBack = {
	...navOptionHandler,
	gestureEnabled: false,
};

const OnboardingNavigator = (): ReactElement => {
	const requiresRemoteRestore = useAppSelector(requiresRemoteRestoreSelector);
	const walletExists = useAppSelector(walletExistsSelector);

	// If a wallet exists but remote LDK revocery is not complete, show the CreateWallet screen
	const initialRouteName =
		walletExists && requiresRemoteRestore ? 'CreateWallet' : 'TermsOfUse';

	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName={initialRouteName}>
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
				<Stack.Screen
					name="CreateWallet"
					component={CreateWallet}
					options={navOptionHandlerNoBack}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default OnboardingNavigator;
