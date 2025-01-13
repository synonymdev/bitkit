import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement, memo } from 'react';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import Liquidity from '../../screens/Wallets/Receive/Liquidity';
import ReceiveAmount from '../../screens/Wallets/Receive/ReceiveAmount';
import ReceiveConnect from '../../screens/Wallets/Receive/ReceiveConnect';
import ReceiveDetails from '../../screens/Wallets/Receive/ReceiveDetails';
import ReceiveGeoBlocked from '../../screens/Wallets/Receive/ReceiveGeoBlocked';
import ReceiveQR from '../../screens/Wallets/Receive/ReceiveQR';
import Tags from '../../screens/Wallets/Receive/Tags';
import { viewControllerSelector } from '../../store/reselect/ui';
import { resetInvoice } from '../../store/slices/receive';
import { NavigationContainer } from '../../styles/components';

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
	ReceiveGeoBlocked: undefined;
	ReceiveConnect: { isAdditional: boolean } | undefined;
	Liquidity: {
		channelSize: number;
		localBalance: number;
		isAdditional: boolean;
	};
};

const Stack = createNativeStackNavigator<ReceiveStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const ReceiveNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();
	const { isOpen, receiveScreen } = useAppSelector((state) => {
		return viewControllerSelector(state, 'receiveNavigation');
	});

	const initialRouteName = receiveScreen ?? 'ReceiveQR';

	const reset = (): void => {
		dispatch(resetInvoice());
	};

	return (
		<BottomSheetWrapper
			view="receiveNavigation"
			snapPoints={snapPoints}
			testID="ReceiveScreen"
			onOpen={reset}
			onClose={reset}>
			<NavigationIndependentTree>
				<NavigationContainer key={isOpen.toString()}>
					<Stack.Navigator
						initialRouteName={initialRouteName}
						screenOptions={screenOptions}>
						<Stack.Screen name="ReceiveQR" component={ReceiveQR} />
						<Stack.Screen name="ReceiveDetails" component={ReceiveDetails} />
						<Stack.Screen name="Tags" component={Tags} />
						<Stack.Screen name="ReceiveAmount" component={ReceiveAmount} />
						<Stack.Screen
							name="ReceiveGeoBlocked"
							component={ReceiveGeoBlocked}
						/>
						<Stack.Screen name="ReceiveConnect" component={ReceiveConnect} />
						<Stack.Screen name="Liquidity" component={Liquidity} />
					</Stack.Navigator>
				</NavigationContainer>
			</NavigationIndependentTree>
		</BottomSheetWrapper>
	);
};

export default memo(ReceiveNavigation);
