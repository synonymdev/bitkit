import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { LNURLPayParams } from 'js-lnurl';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import { useSnapPoints } from '../../hooks/bottomSheet';
import Amount from '../../screens/Wallets/LNURLPay/Amount';
import Confirm from '../../screens/Wallets/LNURLPay/Confirm';
import { viewControllerSelector } from '../../store/reselect/ui';
import { NavigationContainer } from '../../styles/components';

export type LNURLPayNavigationProp =
	NativeStackNavigationProp<LNURLPayStackParamList>;

export type LNURLPayStackParamList = {
	Amount: { pParams: LNURLPayParams };
	Confirm: { amount: number; pParams: LNURLPayParams };
};

const Stack = createNativeStackNavigator<LNURLPayStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	...(__E2E__ ? { animationDuration: 0 } : {}),
};

const LNURLPayNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const { isOpen, pParams } = useSelector((state) => {
		return viewControllerSelector(state, 'lnurlPay');
	});

	if (!pParams) {
		return <></>;
	}

	// if max === min sendable amount, skip the Amount screen
	const initialRouteName =
		pParams.minSendable === pParams.maxSendable ? 'Confirm' : 'Amount';

	return (
		<BottomSheetWrapper view="lnurlPay" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator
					screenOptions={screenOptions}
					initialRouteName={initialRouteName}>
					<Stack.Screen
						name="Amount"
						component={Amount}
						initialParams={{ pParams }}
					/>
					<Stack.Screen
						name="Confirm"
						component={Confirm}
						initialParams={{ pParams, amount: pParams.minSendable }}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(LNURLPayNavigation);
