import React, { ReactElement, memo } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { LNURLPayParams } from 'js-lnurl';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Recipient from '../../screens/Wallets/Send/Recipient';
import Amount from '../../screens/Wallets/Send/Amount';
import FeeRate from '../../screens/Wallets/Send/FeeRate';
import FeeCustom from '../../screens/Wallets/Send/FeeCustom';
import ReviewAndSend from '../../screens/Wallets/Send/ReviewAndSend';
import Tags from '../../screens/Wallets/Send/Tags';
import AutoRebalance from '../../screens/Wallets/Send/AutoRebalance';
import PinCheck from '../../screens/Wallets/Send/PinCheck';
import Pending from '../../screens/Wallets/Send/Pending';
import Success from '../../screens/Wallets/Send/Success';
import Error from '../../screens/Wallets/Send/Error';
import Contacts from '../../screens/Wallets/Send/Contacts';
import Address from '../../screens/Wallets/Send/Address';
import Scanner from '../../screens/Wallets/Send/Scanner';
import CoinSelection from '../../screens/Wallets/Send/CoinSelection';
import LNURLAmount from '../../screens/Wallets/LNURLPay/Amount';
import LNURLConfirm from '../../screens/Wallets/LNURLPay/Confirm';
import { NavigationContainer } from '../../styles/components';
import { TProcessedData } from '../../utils/scanner';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { viewControllerSelector } from '../../store/reselect/ui';
import {
	setupOnChainTransaction,
	setupFeeForOnChainTransaction,
} from '../../store/actions/wallet';
import { __E2E__ } from '../../constants/env';
import { EActivityType } from '../../store/types/activity';
import { updateOnchainFeeEstimates } from '../../store/utils/fees';
import { useLightningBalance } from '../../hooks/lightning';
import { useAppSelector } from '../../hooks/redux';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
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
	Pending: { txId: string };
	Success: { type: EActivityType; amount: number; txId: string };
	Error: { errorMessage: string };
	LNURLAmount: { pParams: LNURLPayParams; url: string };
	LNURLConfirm: { amount: number; pParams: LNURLPayParams; url: string };
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
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const { isOpen, screen, pParams, amount, url } = useAppSelector((state) => {
		return viewControllerSelector(state, 'sendNavigation');
	});
	const transaction = useAppSelector(transactionSelector);

	const initialRouteName = screen ?? 'Recipient';

	const onOpen = async (): Promise<void> => {
		if (!transaction?.lightningInvoice) {
			await updateOnchainFeeEstimates({ selectedNetwork, forceUpdate: true });
			if (!transaction?.inputs.length) {
				await setupOnChainTransaction();
			}
			setupFeeForOnChainTransaction();
		}

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
					<Stack.Screen name="Pending" component={Pending} />
					<Stack.Screen name="Success" component={Success} />
					<Stack.Screen name="Error" component={Error} />
					<Stack.Screen
						name="LNURLAmount"
						component={LNURLAmount}
						initialParams={{ pParams, url }}
					/>
					<Stack.Screen
						name="LNURLConfirm"
						component={LNURLConfirm}
						initialParams={{ pParams, url, amount }}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(SendNavigation);
