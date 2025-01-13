import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { ReactElement } from 'react';

import AuthCheck from '../../components/AuthCheck';
import { __E2E__ } from '../../constants/env';
import MainSettings from '../../screens/Settings';
import AboutSettings from '../../screens/Settings/About';
import AddressTypePreference from '../../screens/Settings/AddressTypePreference';
import AddressViewer from '../../screens/Settings/AddressViewer';
import AdvancedSettings from '../../screens/Settings/Advanced';
import AppStatus from '../../screens/Settings/AppStatus';
import ExportToPhone from '../../screens/Settings/Backup/ExportToPhone';
import ResetAndRestore from '../../screens/Settings/Backup/ResetAndRestore';
import BackupSettings from '../../screens/Settings/BackupSettings';
import BitcoinNetworkSelection from '../../screens/Settings/Bitcoin/BitcoinNetworkSelection';
import CoinSelectPreference from '../../screens/Settings/CoinSelectPreference';
import CurrenciesSettings from '../../screens/Settings/Currencies';
import DevSettings from '../../screens/Settings/DevSettings';
import LdkDebug from '../../screens/Settings/DevSettings/LdkDebug';
import ElectrumConfig from '../../screens/Settings/ElectrumConfig';
import FeeSettings from '../../screens/Settings/Fee';
import GapLimit from '../../screens/Settings/GapLimit';
import GeneralSettings from '../../screens/Settings/General';
import ChannelDetails from '../../screens/Settings/Lightning/ChannelDetails';
import Channels from '../../screens/Settings/Lightning/Channels';
import CloseConnection from '../../screens/Settings/Lightning/CloseConnection';
import LightningNodeInfo from '../../screens/Settings/Lightning/LightningNodeInfo';
import ChangePin from '../../screens/Settings/PIN/ChangePin';
import ChangePin2 from '../../screens/Settings/PIN/ChangePin2';
import DisablePin from '../../screens/Settings/PIN/DisablePin';
import PinChanged from '../../screens/Settings/PIN/PinChanged';
import PaymentPreference from '../../screens/Settings/PaymentPreference';
import QuickpayIntro from '../../screens/Settings/Quickpay/QuickpayIntro';
import QuickpaySettings from '../../screens/Settings/Quickpay/QuickpaySettings';
import RGSServer from '../../screens/Settings/RGSServer';
import ReportIssue from '../../screens/Settings/ReportIssue';
import FormError from '../../screens/Settings/ReportIssue/FormError';
import FormSuccess from '../../screens/Settings/ReportIssue/FormSuccess';
import SecuritySettings from '../../screens/Settings/Security';
import SupportSettings from '../../screens/Settings/SupportSettings';
import TagsSettings from '../../screens/Settings/Tags';
import TransactionSpeedSettings from '../../screens/Settings/TransactionSpeed';
import CustomFee from '../../screens/Settings/TransactionSpeed/CustomFee';
import UnitSettings from '../../screens/Settings/Unit';
import WebRelay from '../../screens/Settings/WebRelay';
import WidgetSettings from '../../screens/Settings/Widgets';
import { TChannel } from '../../store/types/lightning';

export type SettingsNavigationProp =
	NativeStackNavigationProp<SettingsStackParamList>;

export type SettingsStackParamList = {
	AuthCheck: {
		requirePin?: boolean;
		onSuccess: () => void;
		requireBiometrics?: boolean;
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
	SupportSettings: undefined;
	AppStatus: undefined;
	ReportIssue: undefined;
	FormSuccess: undefined;
	FormError: undefined;
	CurrenciesSettings: undefined;
	UnitSettings: undefined;
	TransactionSpeedSettings: undefined;
	CustomFee: undefined;
	ElectrumConfig: undefined;
	GapLimit: undefined;
	RGSServer: undefined;
	CoinSelectPreference: undefined;
	PaymentPreference: undefined;
	AddressTypePreference: undefined;
	DevSettings: undefined;
	LdkDebug: undefined;
	ExportToPhone: undefined;
	ResetAndRestore: undefined;
	BitcoinNetworkSelection: undefined;
	LightningNodeInfo: undefined;
	Channels?: { showClosed: boolean };
	ChannelDetails: { channel: TChannel };
	CloseConnection: { channelId: string };
	TagsSettings: undefined;
	WidgetSettings: undefined;
	QuickpayIntro: undefined;
	QuickpaySettings: undefined;
	AddressViewer: undefined;
	FeeSettings: undefined;
	WebRelay: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
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
			<Stack.Screen name="SupportSettings" component={SupportSettings} />
			<Stack.Screen name="AppStatus" component={AppStatus} />
			<Stack.Screen name="ReportIssue" component={ReportIssue} />
			<Stack.Screen name="FormSuccess" component={FormSuccess} />
			<Stack.Screen name="FormError" component={FormError} />
			<Stack.Screen name="CurrenciesSettings" component={CurrenciesSettings} />
			<Stack.Screen name="UnitSettings" component={UnitSettings} />
			<Stack.Screen
				name="TransactionSpeedSettings"
				component={TransactionSpeedSettings}
			/>
			<Stack.Screen name="CustomFee" component={CustomFee} />
			<Stack.Screen name="WidgetSettings" component={WidgetSettings} />
			<Stack.Screen name="QuickpayIntro" component={QuickpayIntro} />
			<Stack.Screen name="QuickpaySettings" component={QuickpaySettings} />
			<Stack.Screen name="ElectrumConfig" component={ElectrumConfig} />
			<Stack.Screen name="GapLimit" component={GapLimit} />
			<Stack.Screen name="RGSServer" component={RGSServer} />
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
			<Stack.Screen name="LdkDebug" component={LdkDebug} />
			<Stack.Screen name="AddressViewer" component={AddressViewer} />
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
			<Stack.Screen name="TagsSettings" component={TagsSettings} />
			<Stack.Screen name="FeeSettings" component={FeeSettings} />
			<Stack.Screen name="WebRelay" component={WebRelay} />
		</Stack.Navigator>
	);
};

export default SettingsNavigator;
