import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import ReceiveQR from '../../screens/Wallets/Receive/ReceiveQR';
import ReceiveDetails from '../../screens/Wallets/Receive/ReceiveDetails';
import Tags from '../../screens/Wallets/Receive/Tags';
import ReceiveAmount from '../../screens/Wallets/Receive/ReceiveAmount';
import ReceiveConnect from '../../screens/Wallets/Receive/ReceiveConnect';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { NavigationContainer } from '../../styles/components';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';
import { resetInvoice } from '../../store/actions/receive';
import { __E2E__ } from '../../constants/env';

export type ReceiveNavigationProp =
	NativeStackNavigationProp<ReceiveStackParamList>;

export type ReceiveStackParamList = {
	ReceiveQR: undefined;
	ReceiveDetails: {
		receiveAddress: string;
		lightningInvoice?: string;
		enableInstant?: boolean;
	};
	Tags: undefined;
	ReceiveAmount: undefined;
	ReceiveConnect: undefined;
};

const Stack = createNativeStackNavigator<ReceiveStackParamList>();

const navOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const ReceiveNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const isOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'receiveNavigation'),
	);

	return (
		<BottomSheetWrapper
			view="receiveNavigation"
			snapPoints={snapPoints}
			testID="ReceiveScreen"
			onOpen={resetInvoice}
			onClose={resetInvoice}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator screenOptions={navOptions}>
					<Stack.Screen name="ReceiveQR" component={ReceiveQR} />
					<Stack.Screen name="ReceiveDetails" component={ReceiveDetails} />
					<Stack.Screen name="Tags" component={Tags} />
					<Stack.Screen name="ReceiveAmount" component={ReceiveAmount} />
					<Stack.Screen name="ReceiveConnect" component={ReceiveConnect} />
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(ReceiveNavigation);
