import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement, useState } from 'react';

import TabBar from '../../components/TabBar';
import { __E2E__ } from '../../constants/env';
import ActivityFiltered from '../../screens/Activity/ActivityFiltered';
import ActivitySavings from '../../screens/Activity/ActivitySavings';
import ActivitySpending from '../../screens/Activity/ActivitySpending';
import BackupPrompt from '../../screens/Settings/Backup/BackupPrompt';
import WalletsScreen from '../../screens/Wallets';
import AppUpdatePrompt from '../bottom-sheet/AppUpdatePrompt';
import HighBalanceWarning from '../bottom-sheet/HighBalanceWarning';
import QuickPayPrompt from '../bottom-sheet/QuickPayPrompt';
import type { RootStackScreenProps } from '../types';

export type WalletStackParamList = {
	Wallets: { onFocus: (focused: boolean) => void } | undefined;
	ActivitySavings: undefined;
	ActivitySpending: undefined;
	ActivityFiltered: undefined;
};

export type WalletNavigationProp =
	NativeStackNavigationProp<WalletStackParamList>;

const Stack = createNativeStackNavigator<WalletStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const WalletsStack = ({
	navigation,
}: RootStackScreenProps<'Wallet'>): ReactElement => {
	const [isWalletsScreenFocused, setIsFocused] = useState(false);

	return (
		<>
			<Stack.Navigator screenOptions={screenOptions}>
				<Stack.Screen name="Wallets">
					{(props): ReactElement => (
						<WalletsScreen {...props} onFocus={setIsFocused} />
					)}
				</Stack.Screen>
				<Stack.Screen name="ActivitySavings" component={ActivitySavings} />
				<Stack.Screen name="ActivitySpending" component={ActivitySpending} />
				<Stack.Screen name="ActivityFiltered" component={ActivityFiltered} />
			</Stack.Navigator>

			<TabBar navigation={navigation} />

			{/* Put these here so they appear above the TabBar (zIndex) */}
			{/* Should only ever show when user is on the main wallet screen */}
			<BackupPrompt enabled={isWalletsScreenFocused} />
			<HighBalanceWarning enabled={isWalletsScreenFocused} />
			<AppUpdatePrompt enabled={isWalletsScreenFocused} />
			<QuickPayPrompt enabled={isWalletsScreenFocused} />
		</>
	);
};

export default WalletsStack;
