import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { AppState, Linking } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
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
import { useRenderCount } from '../../hooks/helpers';
import { getStore } from '../../store/helpers';
import { updateUi } from '../../store/slices/ui';
import { resetSendTransaction } from '../../store/actions/wallet';
import { isAuthenticatedSelector } from '../../store/reselect/ui';
import AuthCheck from '../../components/AuthCheck';
import Dialog from '../../components/Dialog';
import WalletNavigator from '../wallet/WalletNavigator';
import ActivityDetail from '../../screens/Activity/ActivityDetail';
import ActivityAssignContact from '../../screens/Activity/ActivityAssignContact';
import BuyBitcoin from '../../screens/BuyBitcoin';
import ScannerScreen from '../../screens/Scanner/MainScanner';
import SettingsNavigator from '../settings/SettingsNavigator';
import LightningNavigator from '../lightning/LightningNavigator';
import ForgotPIN from '../../screens/Settings/PIN/ForgotPIN';
import BoostPrompt from '../../screens/Wallets/BoostPrompt';
import NewTxPrompt from '../../screens/Wallets/NewTxPrompt';
import Profile from '../../screens/Profile/Profile';
import ProfileEdit from '../../screens/Profile/ProfileEdit';
import Contacts from '../../screens/Contacts/Contacts';
import Contact from '../../screens/Contacts/Contact';
import ContactEdit from '../../screens/Contacts/ContactEdit';
import Widget from '../../screens/Widgets/Widget';
import WidgetEdit from '../../screens/Widgets/WidgetEdit';
import BackupSubscriber from '../../utils/backup/backups-subscriber';
import SendNavigation from '../bottom-sheet/SendNavigation';
import ReceiveNavigation from '../bottom-sheet/ReceiveNavigation';
import BackupNavigation from '../bottom-sheet/BackupNavigation';
import PINNavigation from '../bottom-sheet/PINNavigation';
import ForceTransfer from '../bottom-sheet/ForceTransfer';
import ConnectionClosed from '../bottom-sheet/ConnectionClosed';
import LNURLWithdrawNavigation from '../bottom-sheet/LNURLWithdrawNavigation';
import LNURLPayNavigation from '../bottom-sheet/LNURLPayNavigation';
import OrangeTicket from '../../screens/OrangeTicket';
import TreasureHuntNavigation from '../bottom-sheet/TreasureHuntNavigation';
import WidgetsSuggestions from '../../screens/Widgets/WidgetsSuggestions';
import {
	HelloWidgets,
	GoodbyePasswords,
} from '../../screens/Widgets/WidgetsOnboarding';
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

const RootNavigator = (): ReactElement => {
	const { t } = useTranslation('other');
	const appState = useRef(AppState.currentState);
	const [showDialog, setShowDialog] = useState(false);
	const [shouldCheckClipboard, setShouldCheckClipboard] = useState(false);
	const dispatch = useAppDispatch();
	const isAuthenticated = useAppSelector(isAuthenticatedSelector);
	const renderCount = useRenderCount();

	const linking: LinkingOptions<{}> = {
		prefixes: ['bitkit', 'slash', 'bitcoin', 'lightning'],
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
		await resetSendTransaction();
		rootNavigation.navigate('Wallet');
		await processInputData({ data: clipboardData, showErrors: false });
	};

	const onAuthSuccess = useCallback((): void => {
		if (shouldCheckClipboard) {
			checkClipboard().then();
		}

		setShouldCheckClipboard(false);
		dispatch(updateUi({ isAuthenticated: true }));
	}, [shouldCheckClipboard, dispatch]);

	useEffect(() => {
		// a bit hacky, but we want to only call this on launch / after launch AuthCheck
		if (isAuthenticated && renderCount <= 2) {
			checkClipboardAndDeeplink().then();
		}

		const appStateSubscription = AppState.addEventListener(
			'change',
			(nextAppState): void => {
				// get state fresh from store everytime
				const uiStore = getStore().ui;

				// on App to foreground
				if (appState.current.match(/background/) && nextAppState === 'active') {
					// prevent redirecting while on AuthCheck
					if (uiStore.isAuthenticated) {
						checkClipboard().then();
					} else {
						setShouldCheckClipboard(true);
					}
				}

				appState.current = nextAppState;
			},
		);

		return () => {
			appStateSubscription.remove();
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated]);

	return (
		<NavigationContainer ref={navigationRef} linking={linking}>
			<Stack.Navigator screenOptions={screenOptions}>
				<Stack.Screen name="Wallet" component={WalletNavigator} />
				<Stack.Screen name="ActivityDetail" component={ActivityDetail} />
				<Stack.Screen
					name="ActivityAssignContact"
					component={ActivityAssignContact}
				/>
				<Stack.Screen name="Scanner" component={ScannerScreen} />
				<Stack.Screen name="LightningRoot" component={LightningNavigator} />
				<Stack.Screen name="Settings" component={SettingsNavigator} />
				<Stack.Screen
					name="Profile"
					component={Profile}
					options={{ gestureDirection: 'horizontal-inverted' }}
				/>
				<Stack.Screen name="ProfileEdit" component={ProfileEdit} />
				<Stack.Screen name="Contacts" component={Contacts} />
				<Stack.Screen name="ContactEdit" component={ContactEdit} />
				<Stack.Screen name="Contact" component={Contact} />
				<Stack.Screen name="BuyBitcoin" component={BuyBitcoin} />
				<Stack.Screen name="HelloWidgets" component={HelloWidgets} />
				<Stack.Screen name="GoodbyePasswords" component={GoodbyePasswords} />
				<Stack.Screen
					name="WidgetsSuggestions"
					component={WidgetsSuggestions}
				/>
				<Stack.Screen name="Widget" component={Widget} />
				<Stack.Screen name="WidgetEdit" component={WidgetEdit} />
			</Stack.Navigator>

			<OrangeTicket />
			<TreasureHuntNavigation />
			<SendNavigation />
			<ReceiveNavigation />
			<BackupNavigation />
			<PINNavigation />
			<BoostPrompt />
			<NewTxPrompt />
			<ForceTransfer />
			<ConnectionClosed />
			<BackupSubscriber />
			<LNURLWithdrawNavigation />
			<LNURLPayNavigation />

			<Dialog
				visible={showDialog && isAuthenticated}
				title={t('clipboard_redirect_title')}
				description={t('clipboard_redirect_msg')}
				onCancel={(): void => setShowDialog(false)}
				onConfirm={onConfirmClipboardRedirect}
			/>

			{!isAuthenticated && (
				<AuthCheck
					showBackNavigation={false}
					showLogoOnPIN={true}
					onSuccess={onAuthSuccess}
				/>
			)}

			<ForgotPIN />
		</NavigationContainer>
	);
};

export default memo(RootNavigator);
