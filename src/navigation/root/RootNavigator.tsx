import Clipboard from '@react-native-clipboard/clipboard';
import {
	NativeStackNavigationOptions,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking } from 'react-native';

import AuthCheck from '../../components/AuthCheck';
import Dialog from '../../components/Dialog';
import { __E2E__ } from '../../constants/env';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';
import { useRenderCount } from '../../hooks/helpers';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import ActivityAssignContact from '../../screens/Activity/ActivityAssignContact';
import ActivityDetail from '../../screens/Activity/ActivityDetail';
import BuyBitcoin from '../../screens/BuyBitcoin';
import Contact from '../../screens/Contacts/Contact';
import ContactEdit from '../../screens/Contacts/ContactEdit';
import Contacts from '../../screens/Contacts/Contacts';
import Profile from '../../screens/Profile/Profile';
import ProfileEdit from '../../screens/Profile/ProfileEdit';
import ScannerScreen from '../../screens/Scanner/MainScanner';
import Widget from '../../screens/Widgets/Widget';
import WidgetEdit from '../../screens/Widgets/WidgetEdit';
import WidgetsOnboarding from '../../screens/Widgets/WidgetsOnboarding';
import WidgetsSuggestions from '../../screens/Widgets/WidgetsSuggestions';
import BottomSheetsLazy from '../../sheets/BottomSheetsLazy';
import ForceTransfer from '../../sheets/ForceTransfer';
import ForgotPIN from '../../sheets/ForgotPIN';
import { resetSendTransaction } from '../../store/actions/wallet';
import { getStore } from '../../store/helpers';
import { isAuthenticatedSelector } from '../../store/reselect/ui';
import { updateUi } from '../../store/slices/ui';
import BackupSubscriber from '../../utils/backup/backups-subscriber';
import { checkClipboardData } from '../../utils/clipboard';
import { processUri } from '../../utils/scanner/scanner';
import SettingsNavigator from '../SettingsNavigator';
import TransferNavigator from '../TransferNavigator';
import WalletNavigator from '../WalletNavigator';
import type { RootStackParamList } from '../types';
import { rootNavigation } from './RootNavigationContainer';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const RootNavigator = (): ReactElement => {
	const { t } = useTranslation('other');
	const appState = useRef(AppState.currentState);
	const [showDialog, setShowDialog] = useState(false);
	const [shouldCheckClipboard, setShouldCheckClipboard] = useState(false);
	const dispatch = useAppDispatch();
	const isAuthenticated = useAppSelector(isAuthenticatedSelector);
	const renderCount = useRenderCount();

	useBottomSheetBackPress();

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
			processUri({ uri: initialUrl });
			return;
		}

		checkClipboard().then();
	};

	const onConfirmClipboardRedirect = async (): Promise<void> => {
		setShowDialog(false);
		const clipboardData = await Clipboard.getString();
		await resetSendTransaction();
		rootNavigation.navigate('Wallet');
		await processUri({ uri: clipboardData, showErrors: false });
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const onAuthSuccess = useCallback((): void => {
		if (shouldCheckClipboard) {
			checkClipboard().then();
		}

		setShouldCheckClipboard(false);
		dispatch(updateUi({ isAuthenticated: true }));
	}, [shouldCheckClipboard, dispatch]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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

		return (): void => {
			appStateSubscription.remove();
		};
	}, [isAuthenticated]);

	return (
		<>
			<Stack.Navigator screenOptions={screenOptions}>
				<Stack.Screen name="Wallet" component={WalletNavigator} />
				<Stack.Screen name="ActivityDetail" component={ActivityDetail} />
				<Stack.Screen
					name="ActivityAssignContact"
					component={ActivityAssignContact}
				/>
				<Stack.Screen name="Scanner" component={ScannerScreen} />
				<Stack.Screen name="TransferRoot" component={TransferNavigator} />
				<Stack.Screen name="Settings" component={SettingsNavigator} />
				<Stack.Screen name="Profile" component={Profile} />
				<Stack.Screen name="ProfileEdit" component={ProfileEdit} />
				<Stack.Screen name="Contacts" component={Contacts} />
				<Stack.Screen name="ContactEdit" component={ContactEdit} />
				<Stack.Screen name="Contact" component={Contact} />
				<Stack.Screen name="BuyBitcoin" component={BuyBitcoin} />
				<Stack.Screen name="WidgetsOnboarding" component={WidgetsOnboarding} />
				<Stack.Screen
					name="WidgetsSuggestions"
					component={WidgetsSuggestions}
				/>
				<Stack.Screen name="Widget" component={Widget} />
				<Stack.Screen name="WidgetEdit" component={WidgetEdit} />
			</Stack.Navigator>

			<BottomSheetsLazy />
			<BackupSubscriber />
			<ForceTransfer />

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

			{/* Should be above AuthCheck */}
			<ForgotPIN />
		</>
	);
};

export default memo(RootNavigator);
