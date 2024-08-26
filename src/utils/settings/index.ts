import { changeIcon } from '@synonymdev/react-native-change-icon';
import { resetKeychainValue, setKeychainValue } from '../keychain';
import { dispatch, getSettingsStore } from '../../store/helpers';
import { updateSettings } from '../../store/slices/settings';
import { appIcon, PIN_ATTEMPTS } from '../../constants/app';

/**
 * @async
 * Set PIN keychain data, update settings state and remove todo item
 */
export const addPin = async (newPin: string): Promise<void> => {
	await editPin(newPin);
};

/**
 * @async
 * Edit PIN keychain data and update settings state
 */
export const editPin = async (newPin: string): Promise<void> => {
	dispatch(updateSettings({ pin: true }));

	await Promise.all([
		setKeychainValue({ key: 'pin', value: newPin }),
		setKeychainValue({ key: 'pinAttemptsRemaining', value: PIN_ATTEMPTS }),
	]);
};

/**
 * @async
 * Wipes PIN data from device memory.
 */
export const removePin = async (): Promise<void> => {
	const { enableStealthMode } = getSettingsStore();

	// reset app icon
	if (enableStealthMode) {
		try {
			await changeIcon(appIcon.default);
		} catch (error) {
			console.error(error);
		}
	}

	// reset settings
	dispatch(
		updateSettings({
			pin: false,
			pinOnLaunch: true,
			pinOnIdle: false,
			pinForPayments: false,
			biometrics: false,
			enableStealthMode: false,
		}),
	);

	// reset PIN keychain data
	await Promise.all([
		setKeychainValue({ key: 'pinAttemptsRemaining', value: PIN_ATTEMPTS }),
		resetKeychainValue({ key: 'pin' }),
	]);
};
