import { resetKeychainValue, setKeychainValue } from '../helpers';
import { updateSettings } from '../../store/actions/settings';
import { getStore } from '../../store/helpers';
import { PIN_ATTEMPTS } from '../../components/PinPad';

/**
 * @async
 * Wipes pin data from device memory.
 */
export const removePin = async (): Promise<void> => {
	await Promise.all([
		updateSettings({ pin: false }),
		setKeychainValue({ key: 'pinAttemptsRemaining', value: PIN_ATTEMPTS }),
		resetKeychainValue({ key: 'pin' }),
	]);
};

/**
 * Toggles biometric authentication.
 * @param {boolean} [biometrics]
 */
export const toggleBiometrics = (
	biometrics: boolean | undefined = undefined,
): void => {
	try {
		const currentBiometrics = getStore().settings.biometrics;
		if (biometrics === undefined) {
			updateSettings({
				biometrics: !currentBiometrics,
			});
			return;
		}
		if (biometrics !== currentBiometrics) {
			updateSettings({
				biometrics: !getStore().settings.biometrics,
			});
		}
	} catch {}
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
		const { pin, pinOnLaunch, pinForPayments, biometrics } =
			getStore().settings;
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
