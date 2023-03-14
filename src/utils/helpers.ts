import { Linking, Vibration } from 'react-native';
import Keychain from 'react-native-keychain';
import NetInfo from '@react-native-community/netinfo';
import { default as bitcoinUnits } from 'bitcoin-units';
import { err, ok, Result } from '@synonymdev/result';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { IGetKeychainValue, IResponse, ISetKeychainValue } from './types';
import { TAvailableNetworks } from './networks';
import {
	TBitcoinAbbreviation,
	TBitcoinLabel,
	EBitcoinUnit,
	TTicker,
} from '../store/types/wallet';
import i18n from '../utils/i18n';

export const promiseTimeout = <T>(
	ms: number,
	promise: Promise<any>,
): Promise<T> => {
	let id: NodeJS.Timeout | undefined;
	const timeout = new Promise((resolve) => {
		id = setTimeout(() => {
			resolve(err('Timed Out.'));
		}, ms);
	});
	return Promise.race([promise, timeout]).then((result) => {
		clearTimeout(id);
		return result;
	});
};

export const setKeychainValue = async ({
	key = '',
	value = '',
}: ISetKeychainValue): Promise<IResponse<string>> => {
	return new Promise(async (resolve) => {
		try {
			await Keychain.setGenericPassword(key, value, { service: key });
			resolve({ error: false, data: '' });
		} catch (e) {
			resolve({ error: true, data: e });
		}
	});
};

export const isOnline = async (): Promise<boolean> => {
	try {
		const connectionInfo = await NetInfo.fetch();
		return connectionInfo.isConnected === true;
	} catch {
		return false;
	}
};

export const getKeychainValue = async ({
	key = '',
}: IGetKeychainValue): Promise<{ error: boolean; data: string }> => {
	return new Promise(async (resolve) => {
		try {
			let result = await Keychain.getGenericPassword({ service: key });
			let data: string | undefined;
			if (!result) {
				return resolve({ error: true, data: '' });
			}
			if (!result.password) {
				return resolve({ error: true, data: '' });
			}
			data = result.password;
			resolve({ error: false, data });
		} catch (e) {
			resolve({ error: true, data: e });
		}
	});
};

/**
 * Returns an array of all known Keychain keys.
 * @returns {Promise<string[]>}
 */
export const getAllKeychainKeys = async (): Promise<string[]> => {
	return await Keychain.getAllGenericPasswordServices();
};

//WARNING: This will wipe the specified key's value from storage
export const resetKeychainValue = async ({
	key = '',
}: {
	key: string;
}): Promise<Result<boolean>> => {
	try {
		const result = await Keychain.resetGenericPassword({ service: key });
		return ok(result);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

interface IGetNetworkData {
	selectedNetwork?: TAvailableNetworks;
	bitcoinUnit?: EBitcoinUnit;
}
interface IGetNetworkDataResponse {
	abbreviation: TBitcoinAbbreviation;
	label: TBitcoinLabel;
	ticker: TTicker;
}
/**
 *
 * @param selectedNetwork {string}
 * @param bitcoinUnit {string}
 * @return {{ abbreviation: string, label: string, ticker: string }}
 */
export const getNetworkData = ({
	selectedNetwork = 'bitcoin',
	bitcoinUnit = EBitcoinUnit.satoshi,
}: IGetNetworkData): IGetNetworkDataResponse => {
	const abbreviation = bitcoinUnit === 'satoshi' ? 'sats' : 'BTC';
	try {
		switch (selectedNetwork) {
			case 'bitcoin':
				return { abbreviation, label: 'Bitcoin Mainnet', ticker: 'BTC' };
			case 'bitcoinTestnet':
				return { abbreviation, label: 'Bitcoin Testnet', ticker: 'tBTC' };
			case 'bitcoinRegtest':
				return { abbreviation, label: 'Bitcoin Regtest', ticker: 'tBTC' };
			default:
				return { abbreviation, label: 'Bitcoin Mainnet', ticker: 'BTC' };
		}
	} catch {
		return { abbreviation, label: 'Bitcoin Mainnet', ticker: 'BTC' };
	}
};

export const btcToSats = (balance: number): number => {
	try {
		return Number(
			bitcoinUnits(balance, 'BTC').to('satoshi').value().toFixed(0),
		);
	} catch (e) {
		return 0;
	}
};

export const satsToBtc = (balance: number): number => {
	return bitcoinUnits(balance, 'sats').to('BTC').value();
};

export const getLastWordInString = (phrase = ''): string => {
	try {
		const n = phrase.split(' ');
		return n[n.length - 1];
	} catch (e) {
		return phrase;
	}
};

/**
 * Sum a specific value in an array of objects.
 * @param arr
 * @param value
 */
export const reduceValue = ({
	arr = [],
	value = '',
}: {
	arr: any[];
	value: string;
}): Result<number> => {
	try {
		if (!value) {
			return err('No value specified.');
		}
		return ok(
			arr.reduce((acc, cur) => {
				return acc + Number(cur[value]);
			}, 0) || 0,
		);
	} catch (e) {
		return err(e);
	}
};

export type TVibrate =
	| 'impactLight'
	| 'impactMedium'
	| 'impactHeavy'
	| 'notificationSuccess'
	| 'notificationWarning'
	| 'notificationError'
	| 'selection'
	| 'default';
/**
 * @param {TVibrate} type
 * @param {number} [pattern]
 */
export const vibrate = ({
	type = 'impactHeavy',
	pattern = 1000,
}: {
	type?: TVibrate;
	pattern?: number;
} = {}): void => {
	try {
		if (type === 'default') {
			Vibration.vibrate(pattern);
			return;
		}
		const options = {
			enableVibrateFallback: true,
			ignoreAndroidSystemSettings: false,
		};
		ReactNativeHapticFeedback.trigger(type, options);
	} catch (e) {
		console.log(e);
	}
};

/**
 * Shuffles a given array.
 * @param {T[]} array
 * @return {T[]}
 */
export const shuffleArray = <T>(array: T[]): T[] => {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
};

/**
 * Truncates strings with an ellipses at the end
 * @param text
 * @param length
 * @returns {string}
 */
export const truncate = (text: string, length: number): string => {
	return trimExtraSpaces(
		text.length > length ? `${text.substring(0, length - 3)}...` : text,
	);
};

/**
 * Truncates strings with an ellipses in the middle
 * @param {string} text
 * @param {number} [maxLength]
 * @returns {string}
 */
export const ellipsis = (text: string, maxLength: number = 15): string => {
	if (!text) {
		return text;
	}
	if (maxLength < 1) {
		return text;
	}
	if (text.length <= maxLength) {
		return text;
	}
	if (maxLength === 1) {
		return text.substring(0, 1) + '...';
	}

	const midpoint = Math.ceil(text.length / 2);
	const toRemove = text.length - maxLength;
	const leftStrip = Math.ceil(toRemove / 2);
	const rightStrip = toRemove - leftStrip;
	const leftText = text.substring(0, midpoint - leftStrip);
	const rightText = text.substring(midpoint + rightStrip);

	return `${leftText}...${rightText}`;
};

/**
 * Trims multiple empty space characters down to one
 * @param text
 * @returns {string}
 */
export const trimExtraSpaces = (text: string): string => {
	return text.trim().replace(/\s{2,}/g, ' ');
};

/**
 * Capitalizes the first letter of every word.
 * @param {string} text
 */
export const capitalize = (text = ''): string => {
	return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Determines if the two arrays passed as params match.
 * @param arr1
 * @param arr2
 * @return boolean
 */
export const arraysMatch = (arr1: unknown[], arr2: unknown[]): boolean => {
	return JSON.stringify(arr1) === JSON.stringify(arr2);
};

/**
 * Determines if the two objects passed as params match.
 * @param obj1
 * @param obj2
 * @return boolean
 */
export const objectsMatch = (obj1, obj2): boolean => {
	if (!obj1 || !obj2) {
		return false;
	}
	const obj1Length = Object.keys(obj1).length;
	const obj2Length = Object.keys(obj2).length;

	if (obj1Length === obj2Length) {
		return Object.keys(obj1).every(
			(key) => key in obj2 && obj2[key] === obj1[key],
		);
	} else {
		return false;
	}
};

/**
 * Determines if all keys in the test object are found in the reference object.
 * @param testObj
 * @param referenceObj
 * @param {string[]} [keysToExclude] Skip recursive check for these keys.
 * @returns boolean
 */
export const isObjPartialMatch = (
	testObj,
	referenceObj,
	keysToExclude: string[] = [],
): boolean => {
	if (typeof testObj !== 'object' || typeof referenceObj !== 'object') {
		return false;
	}
	return Object.keys(testObj).every((key) => {
		if (key in referenceObj) {
			if (!Array.isArray(testObj[key]) && typeof testObj[key] === 'object') {
				if (keysToExclude.includes(key)) {
					return true;
				}
				return isObjPartialMatch(testObj[key], referenceObj[key]);
			}
			return true;
		}
		return false;
	});
};

/**
 * Removes keys from an object and returns the result as a new object
 * @param object
 * @param keysToRemove
 * @return { [key]: string }
 */
export const removeKeysFromObject = (
	object: object,
	keysToRemove: string | string[],
): {} => {
	let condition;

	if (typeof keysToRemove === 'string') {
		condition = (key: string): boolean => !key.includes(keysToRemove);
	} else {
		condition = (key: string): boolean => {
			return !keysToRemove.some((keyToRemove) => key.includes(keyToRemove));
		};
	}

	return Object.keys(object)
		.filter(condition)
		.reduce((prevValue, key) => {
			return Object.assign(prevValue, {
				[key]: object[key],
			});
		}, {});
};

/**
 * Removes all duplicates from an array of objects
 * @param {T[]} arr
 * @param {string} key
 * @return {T[]}
 */
export const getUniqueListBy = <T>(arr: T[], key: string): T[] => [
	...new Map(arr.map((item: T) => [item[key], item])).values(),
];

/**
 * Returns the new value and abbreviation of the provided number for display.
 * @param value
 * @return { newValue: string; abbreviation: string }
 */
export const abbreviateNumber = (
	value: string | number,
): { newValue: string; abbreviation: string } => {
	if (typeof value !== 'number') {
		value = value.replace(/,/g, '');
	}
	let newValue: number = Number(value);
	const abbreviations = [
		'',
		'K',
		'M',
		'B',
		't',
		'q',
		'Q',
		's',
		'S',
		'o',
		'n',
		'd',
		'U',
		'D',
		'T',
		'Qt',
		'Qd',
		'Sd',
		'St',
		'O',
		'N',
		'v',
		'c',
	];
	let abbreviationNum = 0;
	while (newValue >= 1000) {
		newValue /= 1000;
		abbreviationNum++;
	}
	const _newValue = newValue.toPrecision(3);
	const abbreviation = abbreviations[abbreviationNum] ?? '';
	return { newValue: _newValue, abbreviation };
};

export const timeAgo = (timestamp: number): string => {
	const date = new Date(timestamp);

	const today = new Date();
	const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
	const minutes = Math.round(seconds / 60);
	const hours = Math.round(minutes / 60);
	const days = Math.round(hours / 24);
	const isThisYear = today.getFullYear() === date.getFullYear();

	if (seconds < 5) {
		return i18n.t('intl:relativeTime', {
			v: 0,
			range: 'seconds',
			numeric: 'auto',
		});
	} else if (seconds < 60) {
		return i18n.t('intl:relativeTime', {
			v: -seconds,
			range: 'seconds',
			numeric: 'auto',
		});
	} else if (minutes < 60) {
		return i18n.t('intl:relativeTime', {
			v: -minutes,
			range: 'minute',
			numeric: 'auto',
		});
	} else if (hours < 24) {
		return i18n.t('intl:relativeTime', {
			v: -hours,
			range: 'hour',
			numeric: 'auto',
		});
	} else if (days < 10) {
		return i18n.t('intl:relativeTime', {
			v: -days,
			range: 'day',
			numeric: 'auto',
		});
	} else if (isThisYear) {
		// January 1 at 12:00 AM
		return i18n.t('intl:dateTime', {
			v: date,
			formatParams: {
				v: {
					month: 'long',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
				},
			},
		});
	}

	// January 1, 1970
	return i18n.t('intl:dateTime', {
		v: date,
		formatParams: { v: { month: 'long', day: 'numeric', year: 'numeric' } },
	});
};

export const openURL = async (url: string): Promise<void> => {
	const supported = await Linking.canOpenURL(url);

	try {
		if (supported) {
			await Linking.openURL(url);
		} else {
			console.log('Cannot open url: ', url);
		}
	} catch (e) {
		console.log('Cannot open url: ', url);
		console.error('Error open url: ', e);
	}
};

/**
 * Applies an alpha opacity to a hex color
 * @param hexColor
 * @param alpha
 * @returns {string}
 */
export const applyAlpha = (hexColor: string, alpha: number): string => {
	const alpha256 = (alpha * 255).toFixed();
	const alphaBase16 = Number(alpha256).toString(16);
	const paddedAlpha =
		alphaBase16.length === 1 ? alphaBase16.padStart(1, '0') : alphaBase16;
	return hexColor.concat('', paddedAlpha);
};

/**
 * Pauses execution of a function.
 * @param {number} ms The time to wait in milliseconds.
 * @returns {Promise<void>}
 */
export const sleep = (ms = 1000): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Tries to resolve a Promise N times, with a delay between each attempt.
 * @param {() => Promise<T>} toTry The Promise to try to resolve.
 * @param {number} [times] The maximum number of attempts (must be greater than 0).
 * @param {number} [interval] The interval of time between each attempt in milliseconds.
 * @returns {Promise<T>} The resolution of the Promise.
 */
export async function tryNTimes<T>({
	toTry,
	times = 5,
	interval = 50,
}: {
	toTry: () => Promise<Result<T>>;
	times?: number;
	interval?: number;
}): Promise<T> {
	if (times < 1) {
		throw new Error(
			`Bad argument: 'times' must be greater than 0, but ${times} was received.`,
		);
	}
	let attemptCount = 0;
	while (true) {
		try {
			const result = await toTry();
			if (result.isErr()) {
				if (++attemptCount >= times) {
					throw result.error;
				}
			} else {
				return result.value;
			}
		} catch (error) {
			if (++attemptCount >= times) {
				throw error;
			}
		}
		await sleep(interval);
	}
}
