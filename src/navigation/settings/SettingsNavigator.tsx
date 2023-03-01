import React, { ReactElement } from 'react';
import { Platform } from 'react-native';
import { NavigatorScreenParams } from '@react-navigation/native';
import {
	createStackNavigator,
	StackNavigationOptions,
	StackNavigationProp,
} from '@react-navigation/stack';
import { TChannel } from '@synonymdev/react-native-ldk';

import MainSettings from '../../screens/Settings';
import CurrenciesSettings from '../../screens/Settings/Currencies';
import ElectrumConfig from '../../screens/Settings/ElectrumConfig';
import CoinSelectPreference from '../../screens/Settings/CoinSelectPreference';
import PaymentPreference from '../../screens/Settings/PaymentPreference';
import AddressTypePreference from '../../screens/Settings/AddressTypePreference';
import DevSettings from '../../screens/Settings/DevSettings';
import AddressViewer from '../../screens/Settings/AddressViewer';
import BackupData from '../../screens/Settings/Backup/BackupData';
import LightningNodeInfo from '../../screens/Settings/Lightning/LightningNodeInfo';
import BitcoinUnitSettings from '../../screens/Settings/BitcoinUnit';
import TransactionSpeedSettings from '../../screens/Settings/TransactionSpeed';
import CustomFee from '../../screens/Settings/TransactionSpeed/CustomFee';
import AuthCheck from '../../components/AuthCheck';
import GeneralSettings from '../../screens/Settings/General';
import SecuritySettings from '../../screens/Settings/Security';
import ChangePin from '../../screens/Settings/PIN/ChangePin';
import ChangePin2 from '../../screens/Settings/PIN/ChangePin2';
import PinChanged from '../../screens/Settings/PIN/PinChanged';
import DisablePin from '../../screens/Settings/PIN/DisablePin';
import BackupSettings from '../../screens/Settings/BackupSettings';
import AdvancedSettings from '../../screens/Settings/Advanced';
import AboutSettings from '../../screens/Settings/About';
import EasterEgg from '../../screens/Settings/EasterEgg';
import BitcoinNetworkSelection from '../../screens/Settings/Bitcoin/BitcoinNetworkSelection';
import Channels from '../../screens/Settings/Lightning/Channels';
import ChannelDetails from '../../screens/Settings/Lightning/ChannelDetails';
import CloseConnection from '../../screens/Settings/Lightning/CloseConnection';
import OpenConnectionSuccess from '../../screens/Settings/Lightning/OpenConnectionSuccess';
import AddConnection from '../../screens/Settings/Lightning/AddConnection';
import AddConnectionResult from '../../screens/Settings/Lightning/AddConnectionResult';
import ExportToPhone from '../../screens/Settings/Backup/ExportToPhone';
import ResetAndRestore from '../../screens/Settings/Backup/ResetAndRestore';
import SuggestionsSettings from '../../screens/Settings/Suggestions';
import SlashtagsSettings from '../../screens/Settings/SlashtagsSettings';
import LightningNavigator, {
	LightningStackParamList,
} from '../lightning/LightningNavigator';

export type SettingsNavigationProp =
	StackNavigationProp<SettingsStackParamList>;

export type SettingsStackParamList = {
	AuthCheck: {
		requirePin?: boolean;
		onSuccess: () => void;
	};
	MainSettings: undefined;
	GeneralSettings: undefined;
	SecuritySettings: undefined;
	ChangePin: undefined;
	ChangePin2: { pin: string } | undefined;
	PinChanged: undefined;
	DisablePin: undefined;
	BackupSettings: undefined;
	AdvancedSettings: undefined;
	AboutSettings: undefined;
	EasterEgg: undefined;
	CurrenciesSettings: undefined;
	BitcoinUnitSettings: undefined;
	TransactionSpeedSettings: undefined;
	CustomFee: undefined;
	ElectrumConfig: undefined;
	CoinSelectPreference: undefined;
	PaymentPreference: undefined;
	AddressTypePreference: undefined;
	DevSettings: undefined;
	BackupData: undefined;
	ExportToPhone: undefined;
	ResetAndRestore: undefined;
	BitcoinNetworkSelection: undefined;
	LightningNodeInfo: undefined;
	Channels: undefined;
	ChannelDetails: { channel: TChannel };
	CloseConnection: { channelId: string };
	OpenConnectionSuccess: { name: string };
	LightningAddConnection: undefined;
	LightningAddConnectionResult: undefined;
	LightningRoot: NavigatorScreenParams<LightningStackParamList>;
	SlashtagsSettings: undefined;
	SuggestionsSettings: undefined;
	AddressViewer: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

const screenOptions: StackNavigationOptions = {
	// prevent flickering issue on Android
	presentation: Platform.OS === 'ios' ? 'card' : 'transparentModal',
	headerShown: false,
};

const SettingsNavigator = (): ReactElement => {
	return (
		<Stack.Navigator
			screenOptions={screenOptions}
			initialRouteName="MainSettings">
			<Stack.Screen name="AuthCheck" component={AuthCheck} />
			<Stack.Screen name="MainSettings" component={MainSettings} />
			<Stack.Screen name="GeneralSettings" component={GeneralSettings} />
			<Stack.Screen name="SecuritySettings" component={SecuritySettings} />
			<Stack.Screen name="ChangePin" component={ChangePin} />
			<Stack.Screen name="ChangePin2" component={ChangePin2} />
			<Stack.Screen name="PinChanged" component={PinChanged} />
			<Stack.Screen name="DisablePin" component={DisablePin} />
			<Stack.Screen name="BackupSettings" component={BackupSettings} />
			<Stack.Screen name="AdvancedSettings" component={AdvancedSettings} />
			<Stack.Screen name="AboutSettings" component={AboutSettings} />
			<Stack.Screen name="EasterEgg" component={EasterEgg} />
			<Stack.Screen name="CurrenciesSettings" component={CurrenciesSettings} />
			<Stack.Screen
				name="BitcoinUnitSettings"
				component={BitcoinUnitSettings}
			/>
			<Stack.Screen
				name="TransactionSpeedSettings"
				component={TransactionSpeedSettings}
			/>
			<Stack.Screen name="CustomFee" component={CustomFee} />
			<Stack.Screen name="ElectrumConfig" component={ElectrumConfig} />
			<Stack.Screen
				name="CoinSelectPreference"
				component={CoinSelectPreference}
			/>
			<Stack.Screen name="PaymentPreference" component={PaymentPreference} />
			<Stack.Screen
				name="AddressTypePreference"
				component={AddressTypePreference}
			/>
			<Stack.Screen name="DevSettings" component={DevSettings} />
			<Stack.Screen name="AddressViewer" component={AddressViewer} />
			<Stack.Screen name="BackupData" component={BackupData} />
			<Stack.Screen name="ExportToPhone" component={ExportToPhone} />
			<Stack.Screen name="ResetAndRestore" component={ResetAndRestore} />
			<Stack.Screen
				name="BitcoinNetworkSelection"
				component={BitcoinNetworkSelection}
			/>
			<Stack.Screen name="LightningNodeInfo" component={LightningNodeInfo} />
			<Stack.Screen name="Channels" component={Channels} />
			<Stack.Screen name="ChannelDetails" component={ChannelDetails} />
			<Stack.Screen name="CloseConnection" component={CloseConnection} />
			<Stack.Screen
				name="OpenConnectionSuccess"
				component={OpenConnectionSuccess}
			/>
			<Stack.Screen name="LightningAddConnection" component={AddConnection} />
			<Stack.Screen
				name="LightningAddConnectionResult"
				component={AddConnectionResult}
			/>
			<Stack.Screen name="LightningRoot" component={LightningNavigator} />
			<Stack.Screen name="SlashtagsSettings" component={SlashtagsSettings} />
			<Stack.Screen
				name="SuggestionsSettings"
				component={SuggestionsSettings}
			/>
		</Stack.Navigator>
	);
};

export default SettingsNavigator;
