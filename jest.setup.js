import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock';

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native-device-info', () => mockRNDeviceInfo);
jest.mock('react-native-permissions', () =>
	require('react-native-permissions/mock'),
);
