import {
	NavigationIndependentTree,
	createNavigationContainerRef,
} from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { LNURLPayParams } from 'js-lnurl';
import React, { ReactElement, memo } from 'react';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { useLightningBalance } from '../../hooks/lightning';
import { useAppSelector } from '../../hooks/redux';
import LNURLAmount from '../../screens/Wallets/LNURLPay/Amount';
import LNURLConfirm from '../../screens/Wallets/LNURLPay/Confirm';
import Address from '../../screens/Wallets/Send/Address';
import Amount from '../../screens/Wallets/Send/Amount';
import AutoRebalance from '../../screens/Wallets/Send/AutoRebalance';
import CoinSelection from '../../screens/Wallets/Send/CoinSelection';
import Contacts from '../../screens/Wallets/Send/Contacts';
import ErrorScreen from '../../screens/Wallets/Send/Error';
import FeeCustom from '../../screens/Wallets/Send/FeeCustom';
import FeeRate from '../../screens/Wallets/Send/FeeRate';
import Pending from '../../screens/Wallets/Send/Pending';
import PinCheck from '../../screens/Wallets/Send/PinCheck';
import Quickpay from '../../screens/Wallets/Send/Quickpay';
import Recipient from '../../screens/Wallets/Send/Recipient';
import ReviewAndSend from '../../screens/Wallets/Send/ReviewAndSend';
import Scanner from '../../screens/Wallets/Send/Scanner';
import Success from '../../screens/Wallets/Send/Success';
import Tags from '../../screens/Wallets/Send/Tags';
import {
	setupFeeForOnChainTransaction,
	setupOnChainTransaction,
} from '../../store/actions/wallet';
import { viewControllerSelector } from '../../store/reselect/ui';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../store/reselect/wallet';
import { EActivityType } from '../../store/types/activity';
import { updateOnchainFeeEstimates } from '../../store/utils/fees';
import { refreshLdk } from '../../utils/lightning';
import BottomSheetNavigationContainer from './BottomSheetNavigationContainer';

export type SendNavigationProp = NativeStackNavigationProp<SendStackParamList>;

export type SendStackParamList = {
	PinCheck: { onSuccess: () => void };
	Recipient: undefined;
	Contacts: undefined;
	Address: { uri?: string } | undefined;
	Scanner: undefined;
	Amount: undefined;
	CoinSelection: undefined;
	FeeRate: undefined;
	FeeCustom: undefined;
	ReviewAndSend: undefined;
	Tags: undefined;
	AutoRebalance: undefined;
	Pending: { txId: string };
	Quickpay: { invoice: string; amount: number };
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
	const { isOpen, screen, pParams, invoice, amount, url } = useAppSelector(
		(state) => {
			return viewControllerSelector(state, 'sendNavigation');
		},
	);
	const transaction = useAppSelector(transactionSelector);

	const initialRouteName = screen ?? 'Recipient';

	const onOpen = async (): Promise<void> => {
		if (!transaction?.lightningInvoice) {
			await updateOnchainFeeEstimates({ forceUpdate: true });
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
			testID="SendSheet"
			onOpen={onOpen}>
			<NavigationIndependentTree>
				<BottomSheetNavigationContainer
					key={isOpen.toString()}
					ref={navigationRef}>
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
						<Stack.Screen
							name="Quickpay"
							component={Quickpay}
							initialParams={{ invoice, amount }}
						/>
						<Stack.Screen name="Success" component={Success} />
						<Stack.Screen name="Error" component={ErrorScreen} />
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
				</BottomSheetNavigationContainer>
			</NavigationIndependentTree>
		</BottomSheetWrapper>
	);
};

export default memo(SendNavigation);
