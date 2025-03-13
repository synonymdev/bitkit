import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement, memo } from 'react';
import { BiometryType } from 'react-native-biometrics';

import BottomSheet from '../components/BottomSheet';
import { __E2E__ } from '../constants/env';
import AskForBiometrics from '../screens/Settings/PIN/AskForBiometrics';
import ChoosePIN from '../screens/Settings/PIN/ChoosePIN';
import PINPrompt from '../screens/Settings/PIN/PINPrompt';
import Result from '../screens/Settings/PIN/Result';
import { SheetsParamList } from '../store/types/ui';
import BottomSheetNavigationContainer from './BottomSheetNavigationContainer';

export type PinNavigationProp = NativeStackNavigationProp<PinStackParamList>;

export type PinStackParamList = {
	PINPrompt: { showLaterButton: boolean };
	ChoosePIN: { pin: string } | undefined;
	AskForBiometrics: undefined;
	Result: { bio: boolean; type: BiometryType };
};

const Stack = createNativeStackNavigator<PinStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const PINNavigation = (): ReactElement => {
	return (
		<BottomSheet id="pinNavigation" size="medium">
			{({ data }: { data: SheetsParamList['pinNavigation'] }) => {
				const showLaterButton = data?.showLaterButton ?? true;

				return (
					<NavigationIndependentTree>
						<BottomSheetNavigationContainer>
							<Stack.Navigator screenOptions={screenOptions}>
								<Stack.Screen
									name="PINPrompt"
									component={PINPrompt}
									initialParams={{ showLaterButton }}
								/>
								<Stack.Screen name="ChoosePIN" component={ChoosePIN} />
								<Stack.Screen
									name="AskForBiometrics"
									component={AskForBiometrics}
								/>
								<Stack.Screen name="Result" component={Result} />
							</Stack.Navigator>
						</BottomSheetNavigationContainer>
					</NavigationIndependentTree>
				);
			}}
		</BottomSheet>
	);
};

export default memo(PINNavigation);
