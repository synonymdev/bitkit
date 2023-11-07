import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import { createNavigationContainerRef } from '@react-navigation/native';
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
import PinCheck from '../../screens/Wallets/Send/PinCheck';
import Result from '../../screens/Wallets/Send/Result';
import Contacts from '../../screens/Wallets/Send/Contacts';
import Address from '../../screens/Wallets/Send/Address';
import Scanner from '../../screens/Wallets/Send/Scanner';
import CoinSelection from '../../screens/Wallets/Send/CoinSelection';
import { NavigationContainer } from '../../styles/components';
import { TProcessedData } from '../../utils/scanner';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { viewControllerSelector } from '../../store/reselect/ui';
import {
	setupOnChainTransaction,
	setupFeeForOnChainTransaction,
} from '../../store/actions/wallet';
import { __E2E__ } from '../../constants/env';
import { updateOnchainFeeEstimates } from '../../store/actions/fees';
import { useLightningBalance } from '../../hooks/lightning';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { refreshLdk } from '../../utils/lightning';

export type SendNavigationProp = NativeStackNavigationProp<SendStackParamList>;

export type SendStackParamList = {
	PinCheck: { onSuccess: () => void };
	Recipient: undefined;
	Contacts: undefined;
	Address: undefined;
	Scanner: { onScan: (data: TProcessedData) => void } | undefined;
	Amount: undefined;
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
	animation: __E2E__ ? 'none' : 'default',
};

/**
 * Helper function to navigate from outside components.
 */
export const navigationRef = createNavigationContainerRef<SendStackParamList>();
export const sendNavigation = {
	navigate<RouteName extends keyof SendStackParamList>(
		...args: RouteName extends unknown
			? undefined extends SendStackParamList[RouteName]
				?
						| [screen: RouteName]
						| [screen: RouteName, params: SendStackParamList[RouteName]]
				: [screen: RouteName, params: SendStackParamList[RouteName]]
			: never
	): void {
		if (navigationRef.isReady()) {
			const currentRoute = navigationRef.getCurrentRoute()?.name;
			const nextRoute = args[0];

			if (currentRoute === nextRoute) {
				console.log(`Already on screen ${currentRoute}. Skipping...`);
				return;
			}

			navigationRef.navigate(...args);
		} else {
			// sendNavigation not ready, try again after a short wait
			setTimeout(() => sendNavigation.navigate(...args), 200);
		}
	},
};

const SendNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const lightningBalance = useLightningBalance(false);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const { isOpen, screen } = useSelector((state) => {
		return viewControllerSelector(state, 'sendNavigation');
	});

	const initialRouteName = screen ?? 'Recipient';

	const onOpen = async (): Promise<void> => {
		await updateOnchainFeeEstimates({ selectedNetwork, forceUpdate: true });
		await setupOnChainTransaction();
		setupFeeForOnChainTransaction();

		if (lightningBalance.localBalance > 0) {
			refreshLdk({ selectedWallet, selectedNetwork }).then();
		}
	};

	return (
		<BottomSheetWrapper
			view="sendNavigation"
			snapPoints={snapPoints}
			onOpen={onOpen}>
			<NavigationContainer key={isOpen.toString()} ref={navigationRef}>
				<Stack.Navigator
					initialRouteName={initialRouteName}
					screenOptions={screenOptions}>
					<Stack.Screen name="Recipient" component={Recipient} />
					<Stack.Screen name="Contacts" component={Contacts} />
					<Stack.Screen name="Address" component={Address} />
					<Stack.Screen name="Scanner" component={Scanner} />
					<Stack.Screen name="Amount" component={Amount} />
					<Stack.Screen name="CoinSelection" component={CoinSelection} />
					<Stack.Screen name="FeeRate" component={FeeRate} />
					<Stack.Screen name="FeeCustom" component={FeeCustom} />
					<Stack.Screen name="ReviewAndSend" component={ReviewAndSend} />
					<Stack.Screen name="Tags" component={Tags} />
					<Stack.Screen name="AutoRebalance" component={AutoRebalance} />
					<Stack.Screen name="PinCheck" component={PinCheck} />
					<Stack.Screen name="Result" component={Result} />
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(SendNavigation);
