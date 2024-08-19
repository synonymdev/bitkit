import { Platform } from 'react-native';
import { getBundleId } from 'react-native-device-info';

export const appName = 'Bitkit';
export const appStoreUrl =
	'https://apps.apple.com/app/bitkit-wallet/id6502440655';
export const playStoreUrl = `https://play.google.com/store/apps/details?id=${getBundleId()}`;

export const PIN_ATTEMPTS = '8';

export const appIcon = {
	default: 'Default',
	calculator: Platform.OS === 'ios' ? 'AppIconCalculator' : 'Calculator',
};
