import React, { ReactElement, memo } from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import AddressAndAmount from '../../screens/Wallets/Send/AddressAndAmount';
import FeeRate from '../../screens/Wallets/Send/FeeRate';
import FeeCustom from '../../screens/Wallets/Send/FeeCustom';
import Tags from '../../screens/Wallets/Send/Tags';
import ReviewAndSend from '../../screens/Wallets/Send/ReviewAndSend';
import Result from '../../screens/Wallets/Send/Result';
import Scanner from '../../screens/Wallets/Send/Scanner';
import Contacts from '../../screens/Wallets/Send/Contacts';
import CoinSelection from '../../screens/Wallets/Send/CoinSelection';
import AuthCheck from '../../screens/Wallets/Send/SendAuthCheck';
import { NavigationContainer } from '../../styles/components';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import Store from '../../store/types';
import { useSnapPoints } from '../../hooks/bottomSheet';

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
	const snapPoints = useSnapPoints('large');
	const isOpen = useSelector(
		(store: Store) => store.user.viewController.sendNavigation.isOpen,
	);

	return (
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
	);
};

export default memo(SendNavigation);
