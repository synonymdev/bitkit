import React, { ReactElement, useMemo, memo } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import {
	useSafeAreaFrame,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import AddressAndAmount from '../../screens/Wallets/SendOnChainTransaction/AddressAndAmount';
import FeeRate from '../../screens/Wallets/SendOnChainTransaction/FeeRate';
import FeeCustom from '../../screens/Wallets/SendOnChainTransaction/FeeCustom';
import Tags from '../../screens/Wallets/SendOnChainTransaction/Tags';
import ReviewAndSend from '../../screens/Wallets/SendOnChainTransaction/ReviewAndSend';
import Result from '../../screens/Wallets/SendOnChainTransaction/Result';
import Scanner from '../../screens/Wallets/SendOnChainTransaction/Scanner';
import Contacts from '../../screens/Wallets/SendOnChainTransaction/Contacts';
import CoinSelection from '../../screens/Wallets/SendOnChainTransaction/CoinSelection';
import SendNumberPad from '../../screens/Wallets/SendOnChainTransaction/SendNumberPad';
import AuthCheck from '../../components/AuthCheck';
import { NavigationContainer } from '../../styles/components';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import Store from '../../store/types';

export type SendNavigationProp = NativeStackNavigationProp<SendStackParamList>;

export type SendStackParamList = {
	AddressAndAmount: undefined;
	CoinSelection: undefined;
	FeeRate: undefined;
	FeeCustom: undefined;
	Tags: undefined;
	ReviewAndSend: undefined;
	Result: undefined;
	Scanner: undefined;
	Contacts: undefined;
	AuthCheck: { onSuccess: () => void };
};

const Stack = createNativeStackNavigator<SendStackParamList>();
const navOptions: NativeStackNavigationOptions = {
	headerShown: false,
	gestureEnabled: true,
};

const SendNavigation = (): ReactElement => {
	const isOpen = useSelector(
		(store: Store) => store.user.viewController.sendNavigation.isOpen,
	);
	const insets = useSafeAreaInsets();
	const { height } = useSafeAreaFrame();
	const snapPoints = useMemo(
		() => [height - (60 + insets.top)],
		[height, insets.top],
	);

	return (
		<>
			<BottomSheetWrapper
				view="sendNavigation"
				onClose={resetOnChainTransaction}
				onOpen={setupOnChainTransaction}
				snapPoints={snapPoints}>
				<NavigationContainer key={isOpen}>
					<Stack.Navigator screenOptions={navOptions}>
						<Stack.Group screenOptions={navOptions}>
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
							<Stack.Screen name="Contacts" component={Contacts} />
						</Stack.Group>
					</Stack.Navigator>
				</NavigationContainer>
			</BottomSheetWrapper>
			<SendNumberPad />
		</>
	);
};

export default memo(SendNavigation);
