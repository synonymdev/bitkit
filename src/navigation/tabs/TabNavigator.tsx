import React, { ReactElement, useCallback, useMemo } from 'react';
import { Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
	createNativeStackNavigator,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';

import WalletsScreen from '../../screens/Wallets';
import WalletsDetail from '../../screens/Wallets/WalletsDetail';
import BackupPrompt from '../../screens/Settings/Backup/BackupPrompt';
import { ScanIcon, Text02M, View } from '../../styles/components';
import AuthCheck from '../../components/AuthCheck';
import { receiveIcon, sendIcon } from '../../assets/icons/tabs';
import { toggleView } from '../../store/actions/user';
import useColors from '../../hooks/colors';
import { TAssetType } from '../../store/types/wallet';

export type TabNavigationProp = NativeStackNavigationProp<TabStackParamList>;

export type TabStackParamList = {
	Wallets: undefined;
	WalletsDetail: {
		assetType: TAssetType;
	};
	AuthCheck: { onSuccess: () => void };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<TabStackParamList>();

const navOptions = {
	headerShown: false,
	gestureEnabled: true,
	detachInactiveScreens: true,
};

const screenOptions = {
	...navOptions,
};

const modalOptions = {
	...navOptions,
};

const WalletsStack = (): ReactElement => {
	return (
		<Stack.Navigator initialRouteName="Wallets" screenOptions={navOptions}>
			<Stack.Screen
				name="Wallets"
				component={WalletsScreen}
				options={screenOptions}
			/>
			<Stack.Screen name="WalletsDetail" component={WalletsDetail} />
			<Stack.Group screenOptions={modalOptions}>
				<Stack.Screen name="AuthCheck" component={AuthCheck} />
			</Stack.Group>
		</Stack.Navigator>
	);
};

export const TabBar = ({ navigation, state }): ReactElement => {
	const { white08 } = useColors();
	const insets = useSafeAreaInsets();

	const [screen] = useMemo(() => {
		const wsState = state.routes.find((r) => r.name === 'WalletsStack')?.state;
		// wsState is undefined on Wallets screen on initial render
		if (wsState === undefined) {
			return ['Wallets'];
		}
		const s = wsState.routes[wsState.index];
		return [s.name, s.params];
	}, [state]);

	const onReceivePress = useCallback((): void => {
		toggleView({
			view: 'receiveNavigation',
			data: {
				isOpen: true,
				snapPoint: 0,
				initial: 'Receive',
			},
		});
	}, []);

	const onSendPress = useCallback((): void => {
		toggleView({
			view: 'sendNavigation',
			data: {
				isOpen: true,
				snapPoint: 0,
				initial: 'AddressAndAmount',
			},
		});
	}, []);

	const openScanner = useCallback(
		() => navigation.navigate('Scanner'),
		[navigation],
	);

	return (
		<>
			<View style={[styles.tabRoot, { bottom: Math.max(insets.bottom, 5) }]}>
				<TouchableOpacity
					onPress={onSendPress}
					style={[styles.blurContainer, styles.send]}>
					<BlurView style={styles.blur} />
					<SvgXml xml={sendIcon('white')} width={13} height={13} />
					<Text02M style={styles.tabText}>Send</Text02M>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={openScanner}
					activeOpacity={0.8}
					style={[styles.tabScan, { borderColor: white08 }]}>
					<ScanIcon width={32} height={32} />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={onReceivePress}
					style={[styles.blurContainer, styles.receive]}>
					<BlurView style={styles.blur} />
					<SvgXml xml={receiveIcon('white')} width={13} height={13} />
					<Text02M style={styles.tabText}>Receive</Text02M>
				</TouchableOpacity>
			</View>
			<BackupPrompt screen={screen} />
		</>
	);
};

const TabNavigator = (): ReactElement => {
	const tabScreenOptions = useMemo(
		() => ({
			tabBarHideOnKeyboard: true,
			headerShown: false,
		}),
		[],
	);

	return (
		<Tab.Navigator tabBar={(props): ReactElement => <TabBar {...props} />}>
			<Tab.Group screenOptions={tabScreenOptions}>
				<Tab.Screen name="WalletsStack" component={WalletsStack} />
			</Tab.Group>
		</Tab.Navigator>
	);
};

const styles = StyleSheet.create({
	tabRoot: {
		left: 16,
		right: 16,
		height: 80,
		position: 'absolute',
		backgroundColor: 'transparent',
		flexDirection: 'row',
		alignItems: 'center',
	},
	blurContainer: {
		height: 56,
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		overflow: 'hidden',
		backgroundColor:
			Platform.OS === 'android' ? 'rgba(255,255,255,0.1)' : undefined,
	},
	send: {
		paddingRight: 30,
		borderRadius: 30,
	},
	receive: {
		paddingLeft: 30,
		borderRadius: 30,
	},
	blur: {
		...StyleSheet.absoluteFillObject,
	},
	tabScan: {
		height: 80,
		width: 80,
		borderRadius: 40,
		backgroundColor: '#101010',
		marginHorizontal: -40,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
		borderWidth: 2,
	},
	tabText: {
		marginLeft: 6,
	},
});

export default TabNavigator;
