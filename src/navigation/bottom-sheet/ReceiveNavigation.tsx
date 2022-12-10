import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Receive from '../../screens/Wallets/Receive';
import ReceiveDetails from '../../screens/Wallets/Receive/ReceiveDetails';
import Tags from '../../screens/Wallets/Receive/Tags';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { NavigationContainer } from '../../styles/components';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';

export type ReceiveNavigationProp =
	NativeStackNavigationProp<ReceiveStackParamList>;

export type ReceiveStackParamList = {
	Receive: undefined;
	ReceiveDetails: undefined;
	Tags: undefined;
};

const Stack = createNativeStackNavigator<ReceiveStackParamList>();

const navOptions: NativeStackNavigationOptions = {
	headerShown: false,
};

const ReceiveNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const isOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'receiveNavigation'),
	);

	return (
		<BottomSheetWrapper view="receiveNavigation" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen}>
				<Stack.Navigator screenOptions={navOptions}>
					<Stack.Group screenOptions={navOptions}>
						<Stack.Screen name="Receive" component={Receive} />
						<Stack.Screen name="ReceiveDetails" component={ReceiveDetails} />
						<Stack.Screen name="Tags" component={Tags} />
					</Stack.Group>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(ReceiveNavigation);
