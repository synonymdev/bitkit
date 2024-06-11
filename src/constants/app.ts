import { Platform } from 'react-native';
import { getBundleId } from 'react-native-device-info';

export const appName = 'Bitkit';
const appStoreUrl = 'https://apps.apple.com/app/bitkit-wallet/id6502440655';
const playStoreUrl = `https://play.google.com/store/apps/details?id=${getBundleId()}`;
const storeUrl = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;

export const shareText = `Download Bitkit, a self-custodial wallet powering lightning-fast bitcoin payments. Hold your keys, unlock your sovereignty. ${storeUrl}`;
