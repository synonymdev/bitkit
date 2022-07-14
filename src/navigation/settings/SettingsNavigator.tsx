import React, { ReactElement } from 'react';
import { TransitionPresets } from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsMenu from '../../screens/Settings';
import ManageSeedPhrase from '../../screens/Settings/ManageSeedPhrase';
import CurrenciesSettings from '../../screens/Settings/Currencies';
import ElectrumConfig from '../../screens/Settings/ElectrumConfig';
import CoinSelectPreference from '../../screens/Settings/CoinSelectPreference';
import AddressTypePreference from '../../screens/Settings/AddressTypePreference';
import DevSettings from '../../screens/Settings/DevSettings';
import ExportBackups from '../../screens/Settings/Backup/Export';
import Seeds from '../../screens/Settings/Backup/Seeds';
import ViewSeed from '../../screens/Settings/Backup/Seeds/ViewSeed';
import LightningChannels from '../../screens/Settings/Lightning/LightningChannels';
import LightningChannelDetails from '../../screens/Settings/Lightning/LightningChannelDetails';
import LightningNodeInfo from '../../screens/Settings/Lightning/LightningNodeInfo';
import TempSettings from '../../screens/Settings/TempSettings';
import BitcoinUnitSettings from '../../screens/Settings/BitcoinUnit';
import AuthCheck from '../../components/AuthCheck';
import GeneralSettings from '../../screens/Settings/General';
import SecuritySettings from '../../screens/Settings/Security';
import BackupMenu from '../../screens/Settings/BackupMenu';
import NetworksSettings from '../../screens/Settings/Networks';
import AdvancedSettings from '../../screens/Settings/Advanced';
import AboutSettings from '../../screens/Settings/About';
import EasterEgg from '../../screens/Settings/EasterEgg';
import BitcoinNetworkSelection from '../../screens/Settings/Bitcoin/BitcoinNetworkSelection';

const Stack = createNativeStackNavigator();

const navOptions = {
	headerShown: false,
	gestureEnabled: true,
	...TransitionPresets.SlideFromRightIOS,
	detachInactiveScreens: true,
};

const SettingsNavigator = (): ReactElement => {
	return (
		<Stack.Navigator screenOptions={navOptions} initialRouteName="SettingsMenu">
			<Stack.Group screenOptions={navOptions}>
				<Stack.Screen name="SettingsMenu" component={SettingsMenu} />

				<Stack.Screen name="GeneralSettings" component={GeneralSettings} />
				<Stack.Screen name="SecuritySettings" component={SecuritySettings} />
				<Stack.Screen name="BackupMenu" component={BackupMenu} />
				<Stack.Screen name="NetworksSettings" component={NetworksSettings} />
				<Stack.Screen name="AdvancedSettings" component={AdvancedSettings} />
				<Stack.Screen name="AboutSettings" component={AboutSettings} />
				<Stack.Screen name="EasterEgg" component={EasterEgg} />

				<Stack.Screen
					name="CurrenciesSettings"
					component={CurrenciesSettings}
				/>
				<Stack.Screen
					name="BitcoinUnitSettings"
					component={BitcoinUnitSettings}
				/>
				<Stack.Screen name="ElectrumConfig" component={ElectrumConfig} />
				<Stack.Screen name="TempSettings" component={TempSettings} />

				<Stack.Screen
					name="CoinSelectPreference"
					component={CoinSelectPreference}
				/>
				<Stack.Screen
					name="AddressTypePreference"
					component={AddressTypePreference}
				/>
				<Stack.Screen name="DevSettings" component={DevSettings} />
				<Stack.Screen name="ExportBackups" component={ExportBackups} />
				<Stack.Screen name="Seeds" component={Seeds} />
				<Stack.Screen name="ViewSeed" component={ViewSeed} />
				<Stack.Screen name="LightningChannels" component={LightningChannels} />
				<Stack.Screen
					name="LightningChannelDetails"
					component={LightningChannelDetails}
				/>
				<Stack.Screen
					name="BitcoinNetworkSelection"
					component={BitcoinNetworkSelection}
				/>
				<Stack.Screen name="LightningNodeInfo" component={LightningNodeInfo} />
				<Stack.Screen name="ManageSeedPhrase" component={ManageSeedPhrase} />
				<Stack.Screen name="AuthCheck" component={AuthCheck} />
			</Stack.Group>
		</Stack.Navigator>
	);
};

export default SettingsNavigator;
