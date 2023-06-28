import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { LNURLWithdrawParams } from 'js-lnurl';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import { useSnapPoints } from '../../hooks/bottomSheet';
import Amount from '../../screens/Wallets/LNURLWithdraw/Amount';
import Confirm from '../../screens/Wallets/LNURLWithdraw/Confirm';
import { viewControllerSelector } from '../../store/reselect/ui';
import { NavigationContainer } from '../../styles/components';

export type LNURLWithdrawNavigationProp =
	NativeStackNavigationProp<LNURLWithdrawStackParamList>;

export type LNURLWithdrawStackParamList = {
	Amount: { wParams: LNURLWithdrawParams };
	Confirm: { amount: number; wParams: LNURLWithdrawParams };
};

const Stack = createNativeStackNavigator<LNURLWithdrawStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	...(__E2E__ ? { animationDuration: 0 } : {}),
};

const LNURLWithdrawNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const { isOpen, wParams } = useSelector((state) => {
		return viewControllerSelector(state, 'lnurlWithdraw');
	});

	if (!wParams) {
		return <></>;
	}

	// if max === min withdrawable amount, skip the Amount screen
	const initialRouteName =
		wParams.minWithdrawable === wParams.maxWithdrawable ? 'Confirm' : 'Amount';

	return (
		<BottomSheetWrapper view="lnurlWithdraw" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator
					screenOptions={screenOptions}
					initialRouteName={initialRouteName}>
					<Stack.Screen
						name="Amount"
						component={Amount}
						initialParams={{ wParams }}
					/>
					<Stack.Screen
						name="Confirm"
						component={Confirm}
						initialParams={{ wParams, amount: wParams.minWithdrawable }}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(LNURLWithdrawNavigation);
