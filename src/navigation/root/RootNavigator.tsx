import React, {
	ReactElement,
	useCallback,
	memo,
	useEffect,
	useRef,
} from 'react';
import { AppState, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { createNavigationContainerRef } from '@react-navigation/native';
import {
	createStackNavigator,
	StackNavigationOptions,
	TransitionPresets,
} from '@react-navigation/stack';

import { NavigationContainer } from '../../styles/components';
import { processInputData } from '../../utils/scanner';
import { readClipboardData } from '../../utils/send';
import Store from '../../store/types';
import { enableAutoReadClipboardSelector } from '../../store/reselect/settings';
import AuthCheck from '../../components/AuthCheck';
import WalletNavigator from '../wallet/WalletNavigator';
import ActivityDetail from '../../screens/Activity/ActivityDetail';
import ActivityAssignContact from '../../screens/Activity/ActivityAssignContact';
import BuyBitcoin from '../../screens/BuyBitcoin';
import BetaRisk from '../../screens/BetaRisk';
import ScannerScreen from '../../screens/Scanner/MainScanner';
import SettingsNavigator from '../settings/SettingsNavigator';
import LightningNavigator from '../lightning/LightningNavigator';
import TransferNavigator from '../transfer/TransferNavigator';
import ForgotPIN from '../../screens/Settings/PIN/ForgotPIN';
import BoostPrompt from '../../screens/Wallets/BoostPrompt';
import NewTxPrompt from '../../screens/Wallets/NewTxPrompt';
import Profile from '../../screens/Profile/Profile';
import ProfileEdit from '../../screens/Profile/ProfileEdit';
import ProfileAddLink from '../../screens/Profile/ProfileAddLink';
import ProfileLinkSuggestions from '../../screens/Profile/ProfileLinkSuggestions';
import ProfileDetails from '../../screens/Profile/ProfileDetails';
import Contacts from '../../screens/Contacts/Contacts';
import Contact from '../../screens/Contacts/Contact';
import ContactEdit from '../../screens/Contacts/ContactEdit';
import SlashAuthModal from '../../screens/Widgets/SlashAuthModal';
import WidgetFeedEdit from '../../screens/Widgets/WidgetFeedEdit';
import BackupSubscriber from '../../utils/backup/backups-subscriber';
import WidgetsNavigator from '../widgets/WidgetsNavigator';
import SendNavigation from '../bottom-sheet/SendNavigation';
import ReceiveNavigation from '../bottom-sheet/ReceiveNavigation';
import BackupNavigation from '../bottom-sheet/BackupNavigation';
import PINNavigation from '../bottom-sheet/PINNavigation';
import ForceTransfer from '../bottom-sheet/ForceTransfer';
import CloseChannelSuccess from '../bottom-sheet/CloseChannelSuccess';
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
export const rootNavigation = {
	navigate<RouteName extends keyof RootStackParamList>(
		...args: RouteName extends unknown
			? undefined extends RootStackParamList[RouteName]
				?
						| [screen: RouteName]
						| [screen: RouteName, params: RootStackParamList[RouteName]]
				: [screen: RouteName, params: RootStackParamList[RouteName]]
			: never
	): void {
		if (navigationRef.isReady()) {
			navigationRef.navigate(...args);
		} else {
			// Decide what to do if react navigation is not ready
			console.log('rootNavigation not ready');
		}
	},
};

export type TInitialRoutes = 'Wallet' | 'RootAuthCheck';

const RootNavigator = (): ReactElement => {
	const appState = useRef(AppState.currentState);
	const pin = useSelector((state: Store) => state.settings.pin);
	const pinOnLaunch = useSelector((state: Store) => state.settings.pinOnLaunch);
	const enableAutoReadClipboard = useSelector(enableAutoReadClipboardSelector);

	const showAuth = pin && pinOnLaunch;
	const initialRouteName: TInitialRoutes = showAuth
		? 'RootAuthCheck'
		: 'Wallet';

	const linking = {
		prefixes: ['slash'],
		getStateFromPath(path, _config): any {
			if (!pin) {
				processInputData({ data: `slash${path}` });
			} else {
				return {
					routes: [
						{
							name: 'RootAuthCheck',
							params: {
								onSuccess: (): void => {
									rootNavigation.navigate('Wallet');
									processInputData({ data: `slash${path}` });
								},
							},
						},
					],
				};
			}
		},
	};

	useEffect(() => {
		if (enableAutoReadClipboard && !showAuth) {
			readClipboardData().then();
		}

		// on App to foreground
		const appStateSubscription = AppState.addEventListener(
			'change',
			(nextAppState) => {
				if (appState.current.match(/background/) && nextAppState === 'active') {
					const currentRoute = navigationRef.getCurrentRoute()?.name;
					// prevent redirecting while on AuthCheck
					if (enableAutoReadClipboard && currentRoute !== 'RootAuthCheck') {
						readClipboardData().then();
					}
				}

				appState.current = nextAppState;
			},
		);

		return () => {
			appStateSubscription.remove();
		};
	}, [enableAutoReadClipboard, showAuth]);

	const AuthCheckComponent = useCallback(
		({
			navigation,
			route,
		}: RootStackScreenProps<'RootAuthCheck'>): ReactElement => {
			const onSuccess = (): void => {
				if (route.params?.onSuccess) {
					route.params.onSuccess();
				} else {
					navigation.replace('Wallet');

					// check clipboard for payment data
					if (enableAutoReadClipboard) {
						readClipboardData().then();
					}
				}
			};

			return (
				<AuthCheck
					showLogoOnPIN={true}
					showBackNavigation={false}
					onSuccess={onSuccess}
				/>
			);
		},
		[enableAutoReadClipboard],
	);

	return (
		<NavigationContainer ref={navigationRef} linking={linking}>
			<Stack.Navigator
				screenOptions={navOptions}
				// adding this because we are using @react-navigation/stack instead of
				// @react-navigation/native-stack header
				// https://github.com/react-navigation/react-navigation/issues/9015#issuecomment-828700138
				detachInactiveScreens={Platform.OS !== 'ios'}
				initialRouteName={initialRouteName}>
				<Stack.Group screenOptions={navOptions}>
					<Stack.Screen name="RootAuthCheck" component={AuthCheckComponent} />
					<Stack.Screen name="Wallet" component={WalletNavigator} />
					<Stack.Screen name="ActivityDetail" component={ActivityDetail} />
					<Stack.Screen
						name="ActivityAssignContact"
						component={ActivityAssignContact}
					/>
					<Stack.Screen name="Scanner" component={ScannerScreen} />
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
					<Stack.Screen name="ProfileDetails" component={ProfileDetails} />
					<Stack.Screen name="Contacts" component={Contacts} />
					<Stack.Screen name="ContactEdit" component={ContactEdit} />
					<Stack.Screen name="Contact" component={Contact} />
					<Stack.Screen name="BuyBitcoin" component={BuyBitcoin} />
					<Stack.Screen name="BetaRisk" component={BetaRisk} />
					<Stack.Screen name="WidgetFeedEdit" component={WidgetFeedEdit} />
					<Stack.Screen name="WidgetsRoot" component={WidgetsNavigator} />
				</Stack.Group>
			</Stack.Navigator>

			<SendNavigation />
			<ReceiveNavigation />
			<BackupNavigation />
			<PINNavigation />
			<ForgotPIN />
			<BoostPrompt />
			<NewTxPrompt />
			<SlashAuthModal />
			<ForceTransfer />
			<CloseChannelSuccess />
			<BackupSubscriber />
		</NavigationContainer>
	);
};

export default memo(RootNavigator);
