import { resetKeychainValue, setKeychainValue } from '../helpers';
import { updateSettings } from '../../store/actions/settings';
import { getSettingsStore } from '../../store/helpers';
import { PIN_ATTEMPTS } from '../../components/PinPad';
import { removeTodo } from '../../store/actions/todos';

/**
 * @async
 * Set PIN keychain data, update settings state and remove todo item
 */
export const addPin = async (newPin: string): Promise<void> => {
	await Promise.all([editPin(newPin), removeTodo('pin')]);
};

/**
 * @async
 * Edit PIN keychain data and update settings state
 */
export const editPin = async (newPin: string): Promise<void> => {
	await Promise.all([
		setKeychainValue({ key: 'pin', value: newPin }),
		setKeychainValue({ key: 'pinAttemptsRemaining', value: PIN_ATTEMPTS }),
		updateSettings({ pin: true }),
	]);
};

/**
 * @async
 * Wipes PIN data from device memory.
 */
export const removePin = async (): Promise<void> => {
	await Promise.all([
		// reset to defaults
		updateSettings({
			pin: false,
			pinOnLaunch: true,
			pinForPayments: false,
			biometrics: false,
		}),
		setKeychainValue({ key: 'pinAttemptsRemaining', value: PIN_ATTEMPTS }),
		resetKeychainValue({ key: 'pin' }),
		removeTodo('pin'),
	]);
};

/**
 * Returns if the user's various methods of authentication are enabled or disabled.
 */
export const hasEnabledAuthentication = (): {
	pin: boolean;
	pinOnLaunch: boolean;
	pinForPayments: boolean;
	biometrics: boolean;
} => {
	try {
		const { pin, pinOnLaunch, pinForPayments, biometrics } = getSettingsStore();
		return { pin, pinOnLaunch, pinForPayments, biometrics };
	} catch {
		return {
			pin: false,
			pinOnLaunch: false,
			pinForPayments: false,
			biometrics: false,
		};
	}
};
