import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock';
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock';
import * as mockLDK from '@synonymdev/react-native-ldk/dist/mock';

jest.mock('react-native-reanimated', () =>
	require('react-native-reanimated/mock'),
);
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native-device-info', () => mockRNDeviceInfo);
jest.mock('react-native-permissions', () =>
	require('react-native-permissions/mock'),
);
jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);
jest.mock('@synonymdev/react-native-ldk', () => mockLDK);

global.net = require('net'); // needed by Electrum client. For RN it is proviced in shim.js
global.tls = require('tls'); // needed by Electrum client. For RN it is proviced in shim.js
global.fetch = require('node-fetch'); // TODO: replace with native api, when will be available
global.crypto = require('node:crypto');
