import React, { ReactElement, useMemo, memo } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import AddressAndAmount from '../../screens/Wallets/SendOnChainTransaction/AddressAndAmount';
import FeeRate from '../../screens/Wallets/SendOnChainTransaction/FeeRate';
import FeeCustom from '../../screens/Wallets/SendOnChainTransaction/FeeCustom';
import Tags from '../../screens/Wallets/SendOnChainTransaction/Tags';
import ReviewAndSend from '../../screens/Wallets/SendOnChainTransaction/ReviewAndSend';
import SendAssetPickerList from '../../screens/Wallets/SendOnChainTransaction/SendAssetPickerList';
import Result from '../../screens/Wallets/SendOnChainTransaction/Result';
import Scanner from '../../screens/Wallets/SendOnChainTransaction/Scanner';
import CoinSelection from '../../screens/Wallets/SendOnChainTransaction/CoinSelection';
import AuthCheck from '../../components/AuthCheck';
import { NavigationContainer } from '../../styles/components';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import Store from '../../store/types';

export type SendNavigationProp = NativeStackNavigationProp<SendStackParamList>;

export type SendStackParamList = {
	SendAssetPickerList: undefined;
	AddressAndAmount: undefined;
	CoinSelection: undefined;
	FeeRate: undefined;
	FeeCustom: undefined;
	Tags: undefined;
	ReviewAndSend: undefined;
	Result: undefined;
	Scanner: undefined;
	AuthCheck: { onSuccess: () => void };
};

const Stack = createNativeStackNavigator<SendStackParamList>();
const navOptions = {
	headerShown: false,
	gestureEnabled: true,
	detachInactiveScreens: true,
};

const SendNavigation = (): ReactElement => {
	const { isOpen, initial } =
		useSelector((store: Store) => store.user.viewController?.sendNavigation) ??
		{};
	const snapPoints = useMemo(() => [600], []);

	const initialRouteName = !isOpen ? undefined : initial;

	return (
		<BottomSheetWrapper
			view="sendNavigation"
			onClose={resetOnChainTransaction}
			onOpen={setupOnChainTransaction}
			snapPoints={snapPoints}>
			<NavigationContainer key={initialRouteName}>
				<Stack.Navigator
					screenOptions={navOptions}
					// @ts-ignore TODO: fix type
					initialRouteName={initialRouteName}>
					<Stack.Group screenOptions={navOptions}>
						<Stack.Screen
							name="SendAssetPickerList"
							component={SendAssetPickerList}
						/>
						<Stack.Screen
							name="AddressAndAmount"
							component={AddressAndAmount}
						/>
						<Stack.Screen name="CoinSelection" component={CoinSelection} />
						<Stack.Screen name="FeeRate" component={FeeRate} />
						<Stack.Screen name="FeeCustom" component={FeeCustom} />
						<Stack.Screen name="Tags" component={Tags} />
						<Stack.Screen name="ReviewAndSend" component={ReviewAndSend} />
						<Stack.Screen name="Result" component={Result} />
						<Stack.Screen name="AuthCheck" component={AuthCheck} />
						<Stack.Screen name="Scanner" component={Scanner} />
					</Stack.Group>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(SendNavigation);
