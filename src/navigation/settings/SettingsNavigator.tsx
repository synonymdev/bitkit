import React, { ReactElement } from 'react';
import { NavigatorScreenParams } from '@react-navigation/native';
import {
	createNativeStackNavigator,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import MainSettings from '../../screens/Settings';
import CurrenciesSettings from '../../screens/Settings/Currencies';
import ElectrumConfig from '../../screens/Settings/ElectrumConfig';
import GapLimit from '../../screens/Settings/GapLimit';
import RGSServer from '../../screens/Settings/RGSServer';
import CoinSelectPreference from '../../screens/Settings/CoinSelectPreference';
import PaymentPreference from '../../screens/Settings/PaymentPreference';
import AddressTypePreference from '../../screens/Settings/AddressTypePreference';
import DevSettings from '../../screens/Settings/DevSettings';
import LdkDebug from '../../screens/Settings/DevSettings/LdkDebug';
import AddressViewer from '../../screens/Settings/AddressViewer';
import LightningNodeInfo from '../../screens/Settings/Lightning/LightningNodeInfo';
import UnitSettings from '../../screens/Settings/Unit';
import TransactionSpeedSettings from '../../screens/Settings/TransactionSpeed';
import CustomFee from '../../screens/Settings/TransactionSpeed/CustomFee';
import WidgetSettings from '../../screens/Settings/Widgets';
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
import SupportSettings from '../../screens/Settings/SupportSettings';
import ReportIssue from '../../screens/Settings/ReportIssue';
import FormSuccess from '../../screens/Settings/ReportIssue/FormSuccess';
import FormError from '../../screens/Settings/ReportIssue/FormError';
import BitcoinNetworkSelection from '../../screens/Settings/Bitcoin/BitcoinNetworkSelection';
import Channels from '../../screens/Settings/Lightning/Channels';
import ChannelDetails from '../../screens/Settings/Lightning/ChannelDetails';
import CloseConnection from '../../screens/Settings/Lightning/CloseConnection';
import OpenConnectionSuccess from '../../screens/Settings/Lightning/OpenConnectionSuccess';
import AddConnection from '../../screens/Settings/Lightning/AddConnection';
import AddConnectionResult from '../../screens/Settings/Lightning/AddConnectionResult';
import ExportToPhone from '../../screens/Settings/Backup/ExportToPhone';
import ResetAndRestore from '../../screens/Settings/Backup/ResetAndRestore';
import TagsSettings from '../../screens/Settings/Tags';
import FeeSettings from '../../screens/Settings/Fee';
import TransferNavigator, {
	TransferStackParamList,
} from '../transfer/TransferNavigator';
import WebRelay from '../../screens/Settings/WebRelay';
import Ledger from '../../screens/Settings/Ledger';
import LedgerTransaction from '../../screens/Settings/Ledger/LedgerTransaction';
import { __E2E__ } from '../../constants/env';
import AppStatus from '../../screens/Settings/AppStatus';
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
	OpenConnectionSuccess: { name: string };
	LightningAddConnection: undefined;
	LightningAddConnectionResult: undefined;
	TransferRoot: NavigatorScreenParams<TransferStackParamList>;
	TagsSettings: undefined;
	WidgetSettings: undefined;
	AddressViewer: undefined;
	FeeSettings: undefined;
	WebRelay: undefined;
	Ledger: undefined;
	LedgerTransaction: { ledgerTxId: number };
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
			<Stack.Screen
				name="OpenConnectionSuccess"
				component={OpenConnectionSuccess}
			/>
			<Stack.Screen name="LightningAddConnection" component={AddConnection} />
			<Stack.Screen
				name="LightningAddConnectionResult"
				component={AddConnectionResult}
			/>
			<Stack.Screen name="TransferRoot" component={TransferNavigator} />
			<Stack.Screen name="TagsSettings" component={TagsSettings} />
			<Stack.Screen name="FeeSettings" component={FeeSettings} />
			<Stack.Screen name="WebRelay" component={WebRelay} />
			<Stack.Screen name="Ledger" component={Ledger} />
			<Stack.Screen name="LedgerTransaction" component={LedgerTransaction} />
		</Stack.Navigator>
	);
};

export default SettingsNavigator;
