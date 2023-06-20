import React, { ReactElement, memo, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import {
	LinkingOptions,
	createNavigationContainerRef,
} from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';
import {
	createStackNavigator,
	StackNavigationOptions,
	TransitionPresets,
} from '@react-navigation/stack';

import { NavigationContainer } from '../../styles/components';
import { processInputData } from '../../utils/scanner';
import { checkClipboardData } from '../../utils/clipboard';
import { updateUi } from '../../store/actions/ui';
import { isAuthenticatedSelector } from '../../store/reselect/ui';
import { resetSendTransaction } from '../../store/actions/wallet';
import AuthCheck from '../../components/AuthCheck';
import Dialog from '../../components/Dialog';
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
import { __E2E__ } from '../../constants/env';
import type { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

const screenOptions: StackNavigationOptions = {
	...TransitionPresets.SlideFromRightIOS,
	headerShown: false,
	animationEnabled: !__E2E__,
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
	const { t } = useTranslation('other');
	const appState = useRef(AppState.currentState);
	const isAuthenticated = useSelector(isAuthenticatedSelector);

	const [showDialog, setShowDialog] = useState(false);

	const linking: LinkingOptions<{}> = {
		prefixes: ['slash', 'bitcoin', 'lightning'],
		// This is just here to prevent a warning
		config: { screens: { Wallet: '' } },
		subscribe(listener): () => void {
			// Deep linking if the app is already open
			const onReceiveURL = ({ url }: { url: string }): void => {
				rootNavigation.navigate('Wallet');
				processInputData({ data: url });
				return listener(url);
			};

			// Listen to incoming links from deep linking
			const subscription = Linking.addEventListener('url', onReceiveURL);

			return () => {
				subscription.remove();
			};
		},
	};

	const checkClipboard = async (): Promise<void> => {
		const result = await checkClipboardData();
		if (result.isOk()) {
			setShowDialog(true);
		}
	};

	const checkClipboardAndDeeplink = async (): Promise<void> => {
		// Deep linking if the app wasn't previously open
		const initialUrl = await Linking.getInitialURL();
		if (initialUrl) {
			processInputData({ data: initialUrl });
			return;
		}

		checkClipboard().then();
	};

	const onConfirmClipboardRedirect = async (): Promise<void> => {
		setShowDialog(false);
		const clipboardData = await Clipboard.getString();
		resetSendTransaction();
		rootNavigation.navigate('Wallet');
		await processInputData({ data: clipboardData, showErrors: false });
	};

	useEffect(() => {
		if (isAuthenticated) {
			checkClipboardAndDeeplink().then();
		}

		// on App to foreground
		const appStateSubscription = AppState.addEventListener(
			'change',
			(nextAppState) => {
				if (appState.current.match(/background/) && nextAppState === 'active') {
					const currentRoute = navigationRef.getCurrentRoute()?.name;
					// prevent redirecting while on AuthCheck
					if (currentRoute !== 'RootAuthCheck') {
						checkClipboard().then();
					}
				}

				appState.current = nextAppState;
			},
		);

		return () => {
			appStateSubscription.remove();
		};

		// onMount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<NavigationContainer ref={navigationRef} linking={linking}>
			<Stack.Navigator
				screenOptions={screenOptions}
				// adding this because we are using @react-navigation/stack instead of
				// @react-navigation/native-stack header
				// https://github.com/react-navigation/react-navigation/issues/9015#issuecomment-828700138
				detachInactiveScreens={Platform.OS !== 'ios'}>
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
				<Stack.Screen name="ProfileDetails" component={ProfileDetails} />
				<Stack.Screen name="Contacts" component={Contacts} />
				<Stack.Screen name="ContactEdit" component={ContactEdit} />
				<Stack.Screen name="Contact" component={Contact} />
				<Stack.Screen name="BuyBitcoin" component={BuyBitcoin} />
				<Stack.Screen name="BetaRisk" component={BetaRisk} />
				<Stack.Screen name="WidgetFeedEdit" component={WidgetFeedEdit} />
				<Stack.Screen name="WidgetsRoot" component={WidgetsNavigator} />
			</Stack.Navigator>

			<SendNavigation />
			<ReceiveNavigation />
			<BackupNavigation />
			<PINNavigation />
			<BoostPrompt />
			<NewTxPrompt />
			<SlashAuthModal />
			<ForceTransfer />
			<CloseChannelSuccess />
			<BackupSubscriber />

			<Dialog
				visible={showDialog}
				title={t('clipboard_redirect_title')}
				description={t('clipboard_redirect_msg')}
				onCancel={(): void => setShowDialog(false)}
				onConfirm={onConfirmClipboardRedirect}
			/>

			{!isAuthenticated && (
				<AuthCheck
					showBackNavigation={false}
					showLogoOnPIN={true}
					onSuccess={(): void => {
						updateUi({ isAuthenticated: true });
						checkClipboardAndDeeplink().then();
					}}
				/>
			)}

			<ForgotPIN />
		</NavigationContainer>
	);
};

export default memo(RootNavigator);
