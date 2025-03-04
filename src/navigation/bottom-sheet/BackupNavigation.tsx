import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement, memo } from 'react';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { useAppSelector } from '../../hooks/redux';
import ConfirmMnemonic from '../../screens/Settings/Backup/ConfirmMnemonic';
import ConfirmPassphrase from '../../screens/Settings/Backup/ConfirmPassphrase';
import Metadata from '../../screens/Settings/Backup/Metadata';
import MultipleDevices from '../../screens/Settings/Backup/MultipleDevices';
import ShowMnemonic from '../../screens/Settings/Backup/ShowMnemonic';
import ShowPassphrase from '../../screens/Settings/Backup/ShowPassphrase';
import Success from '../../screens/Settings/Backup/Success';
import Warning from '../../screens/Settings/Backup/Warning';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';
import BottomSheetNavigationContainer from './BottomSheetNavigationContainer';

export type BackupNavigationProp =
	NativeStackNavigationProp<BackupStackParamList>;

export type BackupStackParamList = {
	ShowMnemonic: undefined;
	ShowPassphrase: { seed: string[]; bip39Passphrase: string };
	ConfirmMnemonic: { seed: string[]; bip39Passphrase: string };
	ConfirmPassphrase: { bip39Passphrase: string };
	Warning: undefined;
	Success: undefined;
	MultipleDevices: undefined;
	Metadata: undefined;
};

const Stack = createNativeStackNavigator<BackupStackParamList>();

const navOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const BackupNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const isOpen = useAppSelector((state) => {
		return viewControllerIsOpenSelector(state, 'backupNavigation');
	});

	return (
		<BottomSheetWrapper view="backupNavigation" snapPoints={snapPoints}>
			<NavigationIndependentTree>
				<BottomSheetNavigationContainer key={isOpen.toString()}>
					<Stack.Navigator screenOptions={navOptions}>
						<Stack.Screen name="ShowMnemonic" component={ShowMnemonic} />
						<Stack.Screen name="ShowPassphrase" component={ShowPassphrase} />
						<Stack.Screen name="ConfirmMnemonic" component={ConfirmMnemonic} />
						<Stack.Screen
							name="ConfirmPassphrase"
							component={ConfirmPassphrase}
						/>
						<Stack.Screen name="Warning" component={Warning} />
						<Stack.Screen name="Success" component={Success} />
						<Stack.Screen name="MultipleDevices" component={MultipleDevices} />
						<Stack.Screen name="Metadata" component={Metadata} />
					</Stack.Navigator>
				</BottomSheetNavigationContainer>
			</NavigationIndependentTree>
		</BottomSheetWrapper>
	);
};

export default memo(BackupNavigation);
