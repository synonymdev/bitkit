import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { LNURLWithdrawParams } from 'js-lnurl';
import React, { ReactElement, memo } from 'react';

import BottomSheet from '../components/BottomSheet';
import { __E2E__ } from '../constants/env';
import Amount from '../screens/Wallets/LNURLWithdraw/Amount';
import Confirm from '../screens/Wallets/LNURLWithdraw/Confirm';
import { SheetsParamList } from '../store/types/ui';
import BottomSheetNavigationContainer from './BottomSheetNavigationContainer';

export type LNURLWithdrawNavigationProp =
	NativeStackNavigationProp<LNURLWithdrawStackParamList>;

export type LNURLWithdrawStackParamList = {
	Amount: { params: LNURLWithdrawParams };
	Confirm: { amount: number; params: LNURLWithdrawParams };
};

const Stack = createNativeStackNavigator<LNURLWithdrawStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const LNURLWithdrawNavigation = (): ReactElement => {
	return (
		<BottomSheet id="lnurlWithdraw" size="large">
			{({ data }: { data: SheetsParamList['lnurlWithdraw'] }) => {
				// if max === min withdrawable amount, skip the Amount screen
				const initialRouteName =
					data.minWithdrawable === data.maxWithdrawable ? 'Confirm' : 'Amount';

				return (
					<NavigationIndependentTree>
						<BottomSheetNavigationContainer>
							<Stack.Navigator
								screenOptions={screenOptions}
								initialRouteName={initialRouteName}>
								<Stack.Screen
									name="Amount"
									component={Amount}
									initialParams={{ params: data }}
								/>
								<Stack.Screen
									name="Confirm"
									component={Confirm}
									initialParams={{
										params: data,
										amount: data.minWithdrawable,
									}}
								/>
							</Stack.Navigator>
						</BottomSheetNavigationContainer>
					</NavigationIndependentTree>
				);
			}}
		</BottomSheet>
	);
};

export default memo(LNURLWithdrawNavigation);
