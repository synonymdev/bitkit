import React, { ReactElement, memo } from 'react';
import { LNURLWithdrawParams } from 'js-lnurl';
import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { NavigationContainer } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Amount from '../../screens/Wallets/LNURLWithdraw/Amount';
import Confirm from '../../screens/Wallets/LNURLWithdraw/Confirm';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { useAppSelector } from '../../hooks/redux';
import { viewControllerSelector } from '../../store/reselect/ui';
import { __E2E__ } from '../../constants/env';

export type LNURLWithdrawNavigationProp =
	NativeStackNavigationProp<LNURLWithdrawStackParamList>;

export type LNURLWithdrawStackParamList = {
	Amount: { wParams: LNURLWithdrawParams };
	Confirm: { amount: number; wParams: LNURLWithdrawParams };
};

const Stack = createNativeStackNavigator<LNURLWithdrawStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const LNURLWithdrawNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const { isOpen, wParams } = useAppSelector((state) => {
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
			<NavigationIndependentTree>
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
			</NavigationIndependentTree>
		</BottomSheetWrapper>
	);
};

export default memo(LNURLWithdrawNavigation);
