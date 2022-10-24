import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import ShowMnemonic from '../../screens/Settings/Backup/ShowMnemonic';
import ConfirmMnemonic from '../../screens/Settings/Backup/ConfirmMnemonic';
import Result from '../../screens/Settings/Backup/Result';
import Warning from '../../screens/Settings/Backup/Warning';
import Metadata from '../../screens/Settings/Backup/Metadata';
import { NavigationContainer } from '../../styles/components';
import Store from '../../store/types';
import { useSnapPoints } from '../../hooks/bottomSheet';

export type BackupNavigationProp =
	NativeStackNavigationProp<BackupStackParamList>;

export type BackupStackParamList = {
	ShowMnemonic: undefined;
	ConfirmMnemonic: undefined;
	Result: undefined;
	Warning: undefined;
	Metadata: undefined;
};

const Stack = createNativeStackNavigator<BackupStackParamList>();

const navOptions: NativeStackNavigationOptions = {
	headerShown: false,
};

const BackupNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const isOpen = useSelector(
		(store: Store) => store.user.viewController.backupNavigation.isOpen,
	);

	return (
		<BottomSheetWrapper view="backupNavigation" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen}>
				<Stack.Navigator screenOptions={navOptions}>
					<Stack.Group screenOptions={navOptions}>
						<Stack.Screen name="ShowMnemonic" component={ShowMnemonic} />
						<Stack.Screen name="ConfirmMnemonic" component={ConfirmMnemonic} />
						<Stack.Screen name="Result" component={Result} />
						<Stack.Screen name="Warning" component={Warning} />
						<Stack.Screen name="Metadata" component={Metadata} />
					</Stack.Group>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(BackupNavigation);
