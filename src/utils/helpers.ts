import NetInfo from '@react-native-community/netinfo';
import { Result, err, ok } from '@synonymdev/result';
import has from 'lodash/has';
import isPlainObject from 'lodash/isPlainObject';
import keys from 'lodash/keys';
import { Linking, Vibration } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { i18nTime } from '../utils/i18n';

/**
 * Returns the result of a promise, or an error if the promise takes too long to resolve.
 * @param {number} ms The time to wait in milliseconds.
 * @param {Promise<any>} promise The promise to resolve.
 * @returns {Promise<T>}
 */
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

export const isOnline = async (): Promise<boolean> => {
	try {
		const connectionInfo = await NetInfo.fetch();
		return connectionInfo.isConnected === true;
	} catch {
		return false;
	}
};

/**
 * Takes an array of objects, and sums all values pertaining to a specific key.
 * @param arr
 * @param key
 */
export const reduceValue = <T extends object>(
	arr: T[],
	key: keyof T,
): Result<number> => {
	try {
		const sum = arr.reduce((acc, obj) => {
			if (key in obj) {
				if (typeof obj[key] !== 'number') {
					throw `value for '${String(key)}' is not a number`;
				}
				return acc + Number(obj[key]);
			}
			return acc + 0;
		}, 0);

		return ok(sum);
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
export const ellipsis = (text: string, maxLength = 15): string => {
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
		return `${text.substring(0, 1)}...`;
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
export const capitalize = (text: string): string => {
	return text.charAt(0).toUpperCase() + text.slice(1);
};

export const roundUpToTwoDecimals = (num: number): number => {
	return Math.ceil(num * 100) / 100;
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
export const objectsMatch = (
	obj1: { [x: string]: any },
	obj2: { [x: string]: any },
): boolean => {
	if (!obj1 || !obj2) {
		return false;
	}
	const obj1Length = Object.keys(obj1).length;
	const obj2Length = Object.keys(obj2).length;

	if (obj1Length === obj2Length) {
		return Object.keys(obj1).every(
			(key) => key in obj2 && obj2[key] === obj1[key],
		);
	}

	return false;
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

export const deepCompareStructure = (
	obj1: any,
	obj2: any,
	maxDepth: number = Number.POSITIVE_INFINITY,
	currentDepth = 0,
): boolean => {
	// Ensure both objects are plain objects
	if (!isPlainObject(obj1) || !isPlainObject(obj2)) {
		return false;
	}

	// Stop further comparison if max depth is exceeded
	if (currentDepth > maxDepth) {
		return true;
	}

	// Get keys from both objects
	const keys1 = keys(obj1);
	const keys2 = keys(obj2);

	// Check if the number of keys is the same
	if (keys1.length !== keys2.length) {
		return false;
	}

	// Check if all keys from obj1 exist in obj2 and recursively compare their nested objects
	for (const key of keys1) {
		if (!has(obj2, key)) {
			return false;
		}

		const value1 = obj1[key];
		const value2 = obj2[key];

		// If types are different, return false
		if (typeof value1 !== typeof value2) {
			return false;
		}

		// Skip arrays for deep comparison
		if (Array.isArray(value1) && Array.isArray(value2)) {
			continue;
		}

		// If both are plain objects, recurse; otherwise, continue
		if (isPlainObject(value1) && isPlainObject(value2)) {
			if (!deepCompareStructure(value1, value2, maxDepth, currentDepth + 1)) {
				return false;
			}
		}
	}

	return true; // All keys and types match
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
	let condition: (key: string) => boolean;

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

export const timeAgo = (timestamp: string | number | Date): string => {
	const date = new Date(timestamp);

	const today = new Date();
	const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
	const minutes = Math.round(seconds / 60);
	const hours = Math.round(minutes / 60);
	const days = Math.round(hours / 24);
	const isThisYear = today.getFullYear() === date.getFullYear();

	if (seconds < 5) {
		return i18nTime.t('relativeTime', {
			v: 0,
			range: 'seconds',
			numeric: 'auto',
		});
	}
	if (seconds < 60) {
		return i18nTime.t('relativeTime', {
			v: -seconds,
			range: 'seconds',
			numeric: 'auto',
		});
	}
	if (minutes < 60) {
		return i18nTime.t('relativeTime', {
			v: -minutes,
			range: 'minute',
			numeric: 'auto',
		});
	}
	if (hours < 24) {
		return i18nTime.t('relativeTime', {
			v: -hours,
			range: 'hour',
			numeric: 'auto',
		});
	}
	if (days < 10) {
		return i18nTime.t('relativeTime', {
			v: -days,
			range: 'day',
			numeric: 'auto',
		});
	}
	if (isThisYear) {
		// January 1 at 12:00 AM
		return i18nTime.t('dateTime', {
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
	return i18nTime.t('dateTime', {
		v: date,
		formatParams: { v: { month: 'long', day: 'numeric', year: 'numeric' } },
	});
};

export const getDurationForBlocks = (blocks: number): string => {
	if (blocks > 143) {
		return `${Math.round((blocks * 10) / 60 / 24)} days`;
	}
	if (blocks > 6) {
		return `${Math.round((blocks * 10) / 60)}h`;
	}
	return `${blocks * 10}m`;
};

export const openURL = async (url: string): Promise<boolean> => {
	const supported = await Linking.canOpenURL(url);
	try {
		if (supported) {
			await Linking.openURL(url);
			return true;
		}
		console.log('Cannot open url: ', url);
		return false;
	} catch (e) {
		console.log('Cannot open url: ', url);
		console.error('Error open url: ', e);
		return false;
	}
};

export const openAppURL = async (url: string): Promise<void> => {
	try {
		await Linking.openURL(url);
	} catch (_e) {
		console.log('Cannot open url: ', url);
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
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
};

/**
 * Tries to resolve a Promise N times, with a delay between each attempt.
 * @param {() => Promise<T>} toTry The Promise to try to resolve.
 * @param {number} [times] The maximum number of attempts (must be greater than 0).
 * @param {number} [interval] The interval of time between each attempt in milliseconds.
 * @returns {Promise<T>} The resolution of the Promise.
 */
export const tryNTimes = async <T>({
	toTry,
	times = 5,
	interval = 50,
}: {
	toTry: () => Promise<Result<T>>;
	times?: number;
	interval?: number;
}): Promise<T> => {
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
};

export const generateCalendar = (
	date: Date,
	locale: string,
	timeZone: string,
): {
	weekDays: Array<number>;
	weeks: Array<Array<number | null>>;
} => {
	let firstDayOfWeek = 1;
	if (locale === 'en-US') {
		firstDayOfWeek = 7;
	}

	const weekDays: Array<number> = [];
	for (let i = 0; i < 7; i++) {
		weekDays.push(((i - 1 + firstDayOfWeek) % 7) + 1);
	}

	// we are using Intl API here, to be able to set different timezones in tests
	const month = Number(
		new Intl.DateTimeFormat(undefined, {
			month: 'numeric',
			timeZone,
		}).format(date),
	);
	const year = Number(
		new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			timeZone,
		}).format(date),
	);

	const daysInMonth = new Date(year, month, 0).getDate();
	const firstDayOfMonth = new Date(year, month - 1, 1).getDay() || 7; // sunday=0, convert to 7

	let day = 0;
	const weeks: Array<Array<number | null>> = [];

	while (day <= daysInMonth) {
		const week: Array<number | null> = [];

		for (const i of weekDays) {
			if (day === 0 && i === firstDayOfMonth) {
				week.push(1);
				day = 2;
			} else if (day === 0) {
				week.push(null);
			} else if (day > daysInMonth) {
				week.push(null);
				day++;
			} else {
				week.push(day);
				day++;
			}
		}

		weeks.push(week);
	}

	return { weeks, weekDays };
};

export type TGetMinMaxObject<T extends object> = {
	min: T | undefined;
	max: T | undefined;
};

/**
 * Accepts an array of objects and returns the minimum and maximum object based off of the provided key.
 * @template T
 * @param {T[]} arr
 * @param {string} key
 * @returns { min: T | undefined; max: T | undefined }
 */
export const getMinMaxObjects = <T extends object>({
	arr = [],
	key = '',
}: {
	arr: T[];
	key: string;
}): TGetMinMaxObject<T> => {
	let min: T | undefined = undefined;
	let max: T | undefined = undefined;
	arr.forEach((item) => {
		if (key in item && typeof item[key] === 'number') {
			const index = item[key];
			if (!min) {
				min = item;
			}
			if (!max) {
				max = item;
			}
			if (index < min[key]) {
				min = item;
			}
			if (index > max[key]) {
				max = item;
			}
		}
	});
	return { min, max };
};

export const removeKeyFromObject = (
	key: string,
	{ [key]: _, ...rest }: Record<string, any>,
): Record<string, any> => rest;
