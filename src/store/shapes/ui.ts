// NOTE: 'ui' reducer is not persisted to storage

import { TUiState } from '../types/ui';

export const initialUiState: TUiState = {
	appState: 'active',
	availableUpdate: null,
	isAuthenticated: false,
	isConnectedToElectrum: true,
	isElectrumThrottled: false,
	isOnline: true,
	isLDKReady: false, // LDK node running and connected
	language: 'en',
	profileLink: { title: '', url: '' },
	sendTransaction: {
		fromAddressViewer: false, // When true, ensures tx inputs are not cleared when sweeping from address viewer.
		paymentMethod: 'onchain',
		uri: '',
	},
	timeZone: 'UTC',
};
