import React, { ReactElement, useCallback, useMemo, memo } from 'react';
import { useSelector } from 'react-redux';
import { createNavigationContainerRef } from '@react-navigation/native';
import {
	createStackNavigator,
	StackNavigationOptions,
	TransitionPresets,
} from '@react-navigation/stack';

import { NavigationContainer } from '../../styles/components';
import Store from '../../store/types';
import AuthCheck from '../../components/AuthCheck';
import Biometrics from '../../components/Biometrics';
import TabNavigator from '../tabs/TabNavigator';
import Blocktank from '../../screens/Blocktank';
import BlocktankOrder from '../../screens/Blocktank/OrderService';
import BlocktankPayment from '../../screens/Blocktank/Payment';
import ActivityDetail from '../../screens/Activity/ActivityDetail';
import ActivityFiltered from '../../screens/Activity/ActivityFiltered';
import ActivityAssignContact from '../../screens/Activity/ActivityAssignContact';
import BuyBitcoin from '../../screens/BuyBitcoin';
import ScannerScreen from '../../screens/Scanner/MainScanner';
import WalletsDetail from '../../screens/Wallets/WalletsDetail';
import SettingsNavigator from '../settings/SettingsNavigator';
import LightningNavigator from '../lightning/LightningNavigator';
import TransferNavigator from '../transfer/TransferNavigator';
import PINPrompt from '../../screens/Settings/PIN/PINPrompt';
import ForgotPIN from '../../screens/Settings/PIN/ForgotPIN';
import BoostPrompt from '../../screens/Wallets/BoostPrompt';
import NewTxPrompt from '../../screens/Wallets/NewTxPrompt';
import Profile from '../../screens/Profile/Profile';
import ProfileEdit from '../../screens/Profile/ProfileEdit';
import ProfileAddLink from '../../screens/Profile/ProfileAddLink';
import ProfileLinkSuggestions from '../../screens/Profile/ProfileLinkSuggestions';
import Contacts from '../../screens/Contacts/Contacts';
import Contact from '../../screens/Contacts/Contact';
import ContactEdit from '../../screens/Contacts/ContactEdit';
import SlashAuthModal from '../../screens/Widgets/SlashAuthModal';
import WidgetFeedEdit from '../../screens/Widgets/WidgetFeedEdit';
import BackupSubscriber from '../../utils/backup/backups-subscriber';
import BlocktankOrders from '../../screens/Settings/BlocktankOrders';
import BlocktankOrderDetails from '../../screens/Settings/BlocktankOrders/BlocktankOrderDetails';
import WidgetsNavigator from '../widgets/WidgetsNavigator';
import SendNavigation from '../bottom-sheet/SendNavigation';
import ReceiveNavigation from '../bottom-sheet/ReceiveNavigation';
import BackupNavigation from '../bottom-sheet/BackupNavigation';
import PINNavigation from '../bottom-sheet/PINNavigation';
import ForceTransfer from '../bottom-sheet/ForceTransfer';
import type { RootStackParamList, RootStackScreenProps } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

const navOptions: StackNavigationOptions = {
	headerShown: false,
	...TransitionPresets.SlideFromRightIOS,
};

/**
 * Helper function to navigate from outside components.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
export const navigate = navigationRef.navigate;

export type TInitialRoutes = 'Tabs' | 'RootAuthCheck';

const RootNavigator = (): ReactElement => {
	const pin = useSelector((state: Store) => state.settings.pin);
	const pinOnLaunch = useSelector((state: Store) => state.settings.pinOnLaunch);
	const initialRouteName: TInitialRoutes = useMemo(
		() => (pin && pinOnLaunch ? 'RootAuthCheck' : 'Tabs'),
		[pin, pinOnLaunch],
	);

	const AuthCheckComponent = useCallback(
		({ navigation }: RootStackScreenProps<'RootAuthCheck'>): ReactElement => {
			return (
				<AuthCheck
					showLogoOnPIN={true}
					showBackNavigation={false}
					onSuccess={(): void => {
						navigation.replace('Tabs');
					}}
				/>
			);
		},
		[],
	);

	const BiometricsComponent = useCallback(
		({ navigation }: RootStackScreenProps<'Biometrics'>): ReactElement => {
			return (
				<Biometrics
					onSuccess={(): void => {
						navigation.replace('Tabs');
					}}
				/>
			);
		},
		[],
	);

	return (
		<NavigationContainer ref={navigationRef}>
			<Stack.Navigator
				screenOptions={navOptions}
				// adding this because we are using @react-navigation/stack instead of
				// @react-navigation/native-stack header
				// https://github.com/react-navigation/react-navigation/issues/9015#issuecomment-828700138
				detachInactiveScreens={false}
				initialRouteName={initialRouteName}>
				<Stack.Group screenOptions={navOptions}>
					<Stack.Screen name="RootAuthCheck" component={AuthCheckComponent} />
					<Stack.Screen name="Tabs" component={TabNavigator} />
					<Stack.Screen name="Biometrics" component={BiometricsComponent} />
					<Stack.Screen name="Blocktank" component={Blocktank} />
					<Stack.Screen name="BlocktankOrder" component={BlocktankOrder} />
					<Stack.Screen name="BlocktankPayment" component={BlocktankPayment} />
					<Stack.Screen name="ActivityDetail" component={ActivityDetail} />
					<Stack.Screen name="ActivityFiltered" component={ActivityFiltered} />
					<Stack.Screen
						name="ActivityAssignContact"
						component={ActivityAssignContact}
					/>
					<Stack.Screen name="Scanner" component={ScannerScreen} />
					<Stack.Screen name="WalletsDetail" component={WalletsDetail} />
					<Stack.Screen name="LightningRoot" component={LightningNavigator} />
					<Stack.Screen name="Transfer" component={TransferNavigator} />
					<Stack.Screen name="Settings" component={SettingsNavigator} />
					<Stack.Screen
						name="Profile"
						component={Profile}
						options={{ gestureDirection: 'horizontal-inverted' }}
					/>
					<Stack.Screen name="ProfileEdit" component={ProfileEdit} />
					<Stack.Screen name="ProfileAddLink" component={ProfileAddLink} />
					<Stack.Screen
						name="ProfileLinkSuggestions"
						component={ProfileLinkSuggestions}
					/>
					<Stack.Screen name="Contacts" component={Contacts} />
					<Stack.Screen name="ContactEdit" component={ContactEdit} />
					<Stack.Screen name="Contact" component={Contact} />
					<Stack.Screen name="BuyBitcoin" component={BuyBitcoin} />
					<Stack.Screen name="BlocktankOrders" component={BlocktankOrders} />
					<Stack.Screen
						name="BlocktankOrderDetails"
						component={BlocktankOrderDetails}
					/>
					<Stack.Screen name="WidgetFeedEdit" component={WidgetFeedEdit} />
					<Stack.Screen name="WidgetsRoot" component={WidgetsNavigator} />
				</Stack.Group>
			</Stack.Navigator>

			<SendNavigation />
			<ReceiveNavigation />
			<BackupNavigation />
			<PINNavigation />
			<PINPrompt />
			<ForgotPIN />
			<BoostPrompt />
			<NewTxPrompt />
			<SlashAuthModal />
			<ForceTransfer />
			<BackupSubscriber />
		</NavigationContainer>
	);
};

export default memo(RootNavigator);
