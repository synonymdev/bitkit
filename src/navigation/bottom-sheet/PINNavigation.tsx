import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement, memo } from 'react';
import { BiometryType } from 'react-native-biometrics';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { useAppSelector } from '../../hooks/redux';
import AskForBiometrics from '../../screens/Settings/PIN/AskForBiometrics';
import ChoosePIN from '../../screens/Settings/PIN/ChoosePIN';
import PINPrompt from '../../screens/Settings/PIN/PINPrompt';
import Result from '../../screens/Settings/PIN/Result';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';
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
	const snapPoints = useSnapPoints('medium');
	const isOpen = useAppSelector((state) => {
		return viewControllerIsOpenSelector(state, 'PINNavigation');
	});

	return (
		<BottomSheetWrapper view="PINNavigation" snapPoints={snapPoints}>
			<NavigationIndependentTree>
				<BottomSheetNavigationContainer key={isOpen.toString()}>
					<Stack.Navigator screenOptions={screenOptions}>
						<Stack.Screen name="PINPrompt" component={PINPrompt} />
						<Stack.Screen name="ChoosePIN" component={ChoosePIN} />
						<Stack.Screen
							name="AskForBiometrics"
							component={AskForBiometrics}
						/>
						<Stack.Screen name="Result" component={Result} />
					</Stack.Navigator>
				</BottomSheetNavigationContainer>
			</NavigationIndependentTree>
		</BottomSheetWrapper>
	);
};

export default memo(PINNavigation);
