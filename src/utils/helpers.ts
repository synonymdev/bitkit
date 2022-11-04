import Keychain from 'react-native-keychain';
import NetInfo from '@react-native-community/netinfo';
import { IGetKeychainValue, IResponse, ISetKeychainValue } from './types';
import {
	TBitcoinAbbreviation,
	TBitcoinLabel,
	TBitcoinUnit,
	TTicker,
} from '../store/types/wallet';
import { TAvailableNetworks } from './networks';
import { Linking, Vibration } from 'react-native';
import { default as bitcoinUnits } from 'bitcoin-units';
import { err, ok, Result } from '@synonymdev/result';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export const promiseTimeout = <T>(
	ms: number,
	promise: Promise<any>,
): Promise<T> => {
	let id: NodeJS.Timeout | undefined;
	let timeout = new Promise((resolve) => {
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
	bitcoinUnit?: TBitcoinUnit;
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
	bitcoinUnit = 'satoshi',
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
}): void => {
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
 * @param {any[]} array
 * @return {any[]}
 */
export const shuffleArray = (array): any[] => {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
};

/**
 * Truncates strings with an ellipses
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
		condition = (key): boolean => !key.includes(keysToRemove);
	} else {
		condition = (key): boolean => {
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

const monthName = (index): string => {
	//TODO translate these
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	if (index + 1 > months.length) {
		return 'TODO';
	}

	return months[index];
};

export const getFormattedDate = (
	date: Date,
	preFormattedDate: string = '',
	hideYear: boolean = false,
): string => {
	const day = date.getDate();
	const month = monthName(date.getMonth());
	const year = date.getFullYear();
	const hours = date.getHours();
	let minutes = date.getMinutes();
	let minutesStr = `${minutes}`;
	if (minutes < 10) {
		// Adding leading zero to minutes
		minutesStr = `0${minutes}`;
	}

	if (preFormattedDate) {
		// Today at 10:20
		// Yesterday at 10:20
		return `${preFormattedDate} at ${hours}:${minutesStr}`;
	}

	if (hideYear) {
		// 10. January at 10:20
		return `${day} ${month} at ${hours}:${minutesStr}`;
	}

	// 10 January 2017 at 10:20
	return `${day} ${month} ${year} at ${hours}:${minutesStr}`;
};

export const timeAgo = (timestamp: number): string => {
	const date = new Date(timestamp);

	const DAY_IN_MS = 24 * 60 * 60 * 1000;
	const today = new Date();
	const yesterday = new Date(today.getTime() - DAY_IN_MS);
	const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
	const minutes = Math.round(seconds / 60);
	const isToday = today.toDateString() === date.toDateString();
	const isYesterday = yesterday.toDateString() === date.toDateString();
	const isThisYear = today.getFullYear() === date.getFullYear();

	if (seconds < 5) {
		return 'now';
	} else if (seconds < 60) {
		return `${seconds} seconds ago`;
	} else if (seconds < 90) {
		return 'about a minute ago';
	} else if (minutes < 60) {
		return `${minutes} minutes ago`;
	} else if (isToday) {
		return getFormattedDate(date, 'Today'); // Today at 10:20
	} else if (isYesterday) {
		return getFormattedDate(date, 'Yesterday'); // Yesterday at 10:20
	} else if (isThisYear) {
		return getFormattedDate(date, '', true); // 10 January at 10:20
	}

	return getFormattedDate(date); // 10. January 2017. at 10:20
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
 * @param {number} [ms]
 */
export const sleep = (ms = 1000): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
