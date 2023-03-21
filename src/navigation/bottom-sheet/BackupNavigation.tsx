import React, { ReactElement, memo } from 'react';
import { useSelector } from 'react-redux';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import ShowMnemonic from '../../screens/Settings/Backup/ShowMnemonic';
import ShowPassphrase from '../../screens/Settings/Backup/ShowPassphrase';
import ConfirmMnemonic from '../../screens/Settings/Backup/ConfirmMnemonic';
import ConfirmPassphrase from '../../screens/Settings/Backup/ConfirmPassphrase';
import Result from '../../screens/Settings/Backup/Result';
import Warning from '../../screens/Settings/Backup/Warning';
import MultipleDevices from '../../screens/Settings/Backup/MultipleDevices';
import Metadata from '../../screens/Settings/Backup/Metadata';
import { NavigationContainer } from '../../styles/components';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { viewControllerIsOpenSelector } from '../../store/reselect/ui';

export type BackupNavigationProp =
	NativeStackNavigationProp<BackupStackParamList>;

export type BackupStackParamList = {
	ShowMnemonic: undefined;
	ShowPassphrase: { seed: string[]; bip39Passphrase: string };
	ConfirmMnemonic: { seed: string[]; bip39Passphrase: string };
	ConfirmPassphrase: { bip39Passphrase: string };
	Result: undefined;
	Warning: undefined;
	MultipleDevices: undefined;
	Metadata: undefined;
};

const Stack = createNativeStackNavigator<BackupStackParamList>();

const navOptions: NativeStackNavigationOptions = {
	headerShown: false,
};

const BackupNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const isOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'backupNavigation'),
	);

	return (
		<BottomSheetWrapper view="backupNavigation" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator screenOptions={navOptions}>
					<Stack.Group screenOptions={navOptions}>
						<Stack.Screen name="ShowMnemonic" component={ShowMnemonic} />
						<Stack.Screen name="ShowPassphrase" component={ShowPassphrase} />
						<Stack.Screen name="ConfirmMnemonic" component={ConfirmMnemonic} />
						<Stack.Screen
							name="ConfirmPassphrase"
							component={ConfirmPassphrase}
						/>
						<Stack.Screen name="Result" component={Result} />
						<Stack.Screen name="Warning" component={Warning} />
						<Stack.Screen name="MultipleDevices" component={MultipleDevices} />
						<Stack.Screen name="Metadata" component={Metadata} />
					</Stack.Group>
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(BackupNavigation);
