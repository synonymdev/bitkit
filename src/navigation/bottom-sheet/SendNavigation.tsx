import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Recipient from '../../screens/Wallets/Send/Recipient';
import Amount from '../../screens/Wallets/Send/Amount';
import FeeRate from '../../screens/Wallets/Send/FeeRate';
import FeeCustom from '../../screens/Wallets/Send/FeeCustom';
import ReviewAndSend from '../../screens/Wallets/Send/ReviewAndSend';
import Tags from '../../screens/Wallets/Send/Tags';
import AutoRebalance from '../../screens/Wallets/Send/AutoRebalance';
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
import { useSnapPoints } from '../../hooks/bottomSheet';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';
import { TProcessedData } from '../../utils/scanner';
import { createNavigationContainerRef } from '@react-navigation/native';

export type SendNavigationProp = NativeStackNavigationProp<SendStackParamList>;

export type SendStackParamList = {
	AuthCheck: { onSuccess: () => void };
	Recipient: undefined;
	Amount: undefined;
	Scanner: { onScan: (data: TProcessedData) => void } | undefined;
	Contacts: undefined;
	CoinSelection: undefined;
	FeeRate: undefined;
	FeeCustom: undefined;
	ReviewAndSend: undefined;
	Tags: undefined;
	AutoRebalance: undefined;
	Result: {
		success: boolean;
		txId?: string;
		errorTitle?: string;
		errorMessage?: string;
	};
};

const Stack = createNativeStackNavigator<SendStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
};

/**
 * Helper function to navigate from outside components.
 */
export const navigationRef = createNavigationContainerRef<SendStackParamList>();
export const sendNavigation = {
	isReady: navigationRef.isReady,
	navigate: navigationRef.navigate,
};

const SendNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const isOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'sendNavigation'),
	);

	return (
		<BottomSheetWrapper
			view="sendNavigation"
			snapPoints={snapPoints}
			onClose={resetOnChainTransaction}
			onOpen={setupOnChainTransaction}>
			<NavigationContainer key={isOpen.toString()} ref={navigationRef}>
				<Stack.Navigator screenOptions={screenOptions}>
					<Stack.Screen name="Recipient" component={Recipient} />
					<Stack.Screen name="Scanner" component={Scanner} />
					<Stack.Screen name="Contacts" component={Contacts} />
					<Stack.Screen name="Amount" component={Amount} />
					<Stack.Screen name="CoinSelection" component={CoinSelection} />
					<Stack.Screen name="FeeRate" component={FeeRate} />
					<Stack.Screen name="FeeCustom" component={FeeCustom} />
					<Stack.Screen name="ReviewAndSend" component={ReviewAndSend} />
					<Stack.Screen name="Tags" component={Tags} />
					<Stack.Screen name="AutoRebalance" component={AutoRebalance} />
					<Stack.Screen name="Result" component={Result} />
					<Stack.Screen name="AuthCheck" component={AuthCheck} />
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(SendNavigation);
