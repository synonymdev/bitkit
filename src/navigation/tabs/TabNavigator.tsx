import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
	BottomTabBarProps,
	createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
	createStackNavigator,
	StackNavigationOptions,
	TransitionPresets,
} from '@react-navigation/stack';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WalletsScreen from '../../screens/Wallets';
import WalletsDetail from '../../screens/Wallets/WalletsDetail';
import BackupPrompt from '../../screens/Settings/Backup/BackupPrompt';
import HighBalanceWarning from '../bottom-sheet/HighBalanceWarning';
import AppUpdatePrompt from '../bottom-sheet/AppUpdatePrompt';
import { ScanIcon, Text02M } from '../../styles/components';
import AuthCheck from '../../components/AuthCheck';
import BlurView from '../../components/BlurView';
import { receiveIcon, sendIcon } from '../../assets/icons/tabs';
import { toggleView } from '../../store/actions/ui';
import useColors from '../../hooks/colors';
import { TAssetType } from '../../store/types/wallet';

export type TabStackParamList = {
	AuthCheck: { onSuccess: () => void };
	Wallets: undefined;
	WalletsDetail: {
		assetType: TAssetType;
	};
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<TabStackParamList>();

const navOptions: StackNavigationOptions = {
	headerShown: false,
};

const screenOptions: StackNavigationOptions = {
	...navOptions,
	...TransitionPresets.SlideFromRightIOS,
};

const modalOptions = {
	...navOptions,
};

const WalletsStack = (): ReactElement => {
	return (
		<Stack.Navigator initialRouteName="Wallets" screenOptions={navOptions}>
			<Stack.Group screenOptions={screenOptions}>
				<Stack.Screen name="Wallets" component={WalletsScreen} />
				<Stack.Screen name="WalletsDetail" component={WalletsDetail} />
			</Stack.Group>
			<Stack.Group screenOptions={modalOptions}>
				<Stack.Screen name="AuthCheck" component={AuthCheck} />
			</Stack.Group>
		</Stack.Navigator>
	);
};

export const TabBar = ({
	navigation,
	state,
}: BottomTabBarProps): ReactElement => {
	const { white08 } = useColors();
	const insets = useSafeAreaInsets();
	const [isFocused, setIsFocused] = useState(false);

	useFocusEffect(
		useCallback(() => {
			setIsFocused(true);

			return (): void => {
				setIsFocused(false);
			};
		}, []),
	);

	const screen = useMemo(() => {
		const wsState = state.routes.find((r) => r.name === 'WalletsStack')?.state;

		// wsState is undefined on Wallets screen on initial render
		if (!wsState?.index) {
			return 'Wallets';
		}

		return wsState.routes[wsState.index].name;
	}, [state]);

	const onReceivePress = useCallback((): void => {
		toggleView({
			view: 'receiveNavigation',
			data: { isOpen: true },
		});
	}, []);

	const onSendPress = useCallback((): void => {
		toggleView({
			view: 'sendNavigation',
			data: { isOpen: true },
		});
	}, []);

	const openScanner = useCallback(
		() => navigation.navigate('Scanner'),
		[navigation],
	);

	const isWalletScreenFocused = useMemo(
		() => isFocused && screen === 'Wallets',
		[isFocused, screen],
	);

	const borderStyles = useMemo(() => {
		const androidStyles = {
			borderColor: white08,
			borderTopColor: '#272727',
			borderBottomColor: '#272727',
		};

		const iosStyles = {
			borderColor: white08,
		};
		return Platform.OS === 'android' ? androidStyles : iosStyles;
	}, [white08]);

	const bottom = useMemo(() => Math.max(insets.bottom, 16), [insets.bottom]);

	const sendXml = useMemo(() => sendIcon('white'), []);
	const receiveXml = useMemo(() => receiveIcon('white'), []);

	return (
		<>
			<View style={[styles.tabRoot, { bottom }]}>
				<TouchableOpacity onPress={onSendPress} style={styles.blurContainer}>
					<BlurView style={styles.send}>
						<SvgXml xml={sendXml} width={13} height={13} />
						<Text02M style={styles.tabText}>Send</Text02M>
					</BlurView>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={openScanner}
					activeOpacity={0.8}
					style={[styles.tabScan, borderStyles]}>
					<ScanIcon width={32} height={32} />
				</TouchableOpacity>
				<TouchableOpacity onPress={onReceivePress} style={styles.blurContainer}>
					<BlurView style={styles.receive}>
						<SvgXml xml={receiveXml} width={13} height={13} />
						<Text02M style={styles.tabText}>Receive</Text02M>
					</BlurView>
				</TouchableOpacity>
			</View>

			{isWalletScreenFocused && (
				<>
					<BackupPrompt />
					<HighBalanceWarning />
					<AppUpdatePrompt />
				</>
			)}
		</>
	);
};

const tabScreenOptions = {
	tabBarHideOnKeyboard: true,
	headerShown: false,
};

const TabNavigator = (): ReactElement => {
	const tabBar = useCallback((props) => {
		return <TabBar {...props} />;
	}, []);

	return (
		<Tab.Navigator tabBar={tabBar} screenOptions={tabScreenOptions}>
			<Tab.Screen name="WalletsStack" component={WalletsStack} />
		</Tab.Navigator>
	);
};

const styles = StyleSheet.create({
	tabRoot: {
		position: 'absolute',
		left: 16,
		right: 16,
		height: 80,
		flexDirection: 'row',
		alignItems: 'center',
		zIndex: 0,
	},
	blurContainer: {
		height: 56,
		flex: 1,
	},
	send: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		paddingRight: 30,
		borderRadius: 30,
	},
	receive: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		paddingLeft: 30,
		borderRadius: 30,
	},
	tabScan: {
		height: 80,
		width: 80,
		backgroundColor: '#101010',
		borderRadius: 40,
		borderWidth: 2,
		marginHorizontal: -40,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	tabText: {
		marginLeft: 6,
	},
});

export default TabNavigator;
