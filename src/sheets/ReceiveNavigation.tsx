import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement, memo } from 'react';

import BottomSheet from '../components/BottomSheet';
import { __E2E__ } from '../constants/env';
import { useAppDispatch } from '../hooks/redux';
import Liquidity from '../screens/Wallets/Receive/Liquidity';
import ReceiveAmount from '../screens/Wallets/Receive/ReceiveAmount';
import ReceiveConnect from '../screens/Wallets/Receive/ReceiveConnect';
import ReceiveDetails from '../screens/Wallets/Receive/ReceiveDetails';
import ReceiveGeoBlocked from '../screens/Wallets/Receive/ReceiveGeoBlocked';
import ReceiveQR from '../screens/Wallets/Receive/ReceiveQR';
import Tags from '../screens/Wallets/Receive/Tags';
import { resetInvoice } from '../store/slices/receive';
import { SheetsParamList } from '../store/types/ui';
import BottomSheetNavigationContainer from './BottomSheetNavigationContainer';

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
	const dispatch = useAppDispatch();

	const reset = (): void => {
		dispatch(resetInvoice());
	};

	return (
		<BottomSheet
			id="receive"
			size="large"
			testID="ReceiveScreen"
			onOpen={reset}
			onClose={reset}>
			{({ data }: { data: SheetsParamList['receive'] }) => {
				const initialRouteName = data?.screen ?? 'ReceiveQR';

				return (
					<NavigationIndependentTree>
						<BottomSheetNavigationContainer>
							<Stack.Navigator
								initialRouteName={initialRouteName}
								screenOptions={screenOptions}>
								<Stack.Screen name="ReceiveQR" component={ReceiveQR} />
								<Stack.Screen
									name="ReceiveDetails"
									component={ReceiveDetails}
								/>
								<Stack.Screen name="Tags" component={Tags} />
								<Stack.Screen name="ReceiveAmount" component={ReceiveAmount} />
								<Stack.Screen
									name="ReceiveGeoBlocked"
									component={ReceiveGeoBlocked}
								/>
								<Stack.Screen
									name="ReceiveConnect"
									component={ReceiveConnect}
								/>
								<Stack.Screen name="Liquidity" component={Liquidity} />
							</Stack.Navigator>
						</BottomSheetNavigationContainer>
					</NavigationIndependentTree>
				);
			}}
		</BottomSheet>
	);
};

export default memo(ReceiveNavigation);
