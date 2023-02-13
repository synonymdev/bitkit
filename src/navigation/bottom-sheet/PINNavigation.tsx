import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import { BiometryType } from 'react-native-biometrics';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import ChoosePIN from '../../screens/Settings/PIN/ChoosePIN';
import Result from '../../screens/Settings/PIN/Result';
import AskForBiometrics from '../../screens/Settings/PIN/AskForBiometrics';
import { NavigationContainer } from '../../styles/components';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';

export type PinNavigationProp = NativeStackNavigationProp<PinStackParamList>;

export type PinStackParamList = {
	ChoosePIN: { pin: string } | undefined;
	AskForBiometrics: undefined;
	Result: { bio: boolean; type: BiometryType };
};

const Stack = createNativeStackNavigator<PinStackParamList>();

const navOptions: NativeStackNavigationOptions = {
	headerShown: false,
};

const PINNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const isOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'PINNavigation'),
	);

	return (
		<BottomSheetWrapper view="PINNavigation" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator screenOptions={navOptions}>
					<Stack.Group screenOptions={navOptions}>
						<Stack.Screen name="ChoosePIN" component={ChoosePIN} />
						<Stack.Screen
							name="AskForBiometrics"
							component={AskForBiometrics}
						/>
						<Stack.Screen name="Result" component={Result} />
					</Stack.Group>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(PINNavigation);
