import { Linking, Vibration } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { err, ok, Result } from '@synonymdev/result';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { i18nTime } from '../utils/i18n';

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
 * Sum a specific value in an array of objects.
 * @param arr
 * @param value
 */
export const reduceValue = <T>({
	arr,
	value,
}: {
	arr: T[];
	value: keyof T;
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
 * Returns the last word in a string.
 * @param {string} phrase
 */
export const getLastWordInString = (phrase: string): string => {
	try {
		const n = phrase.split(' ');
		return n[n.length - 1];
	} catch (e) {
		return phrase;
	}
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
		return i18nTime.t('relativeTime', {
			v: 0,
			range: 'seconds',
			numeric: 'auto',
		});
	} else if (seconds < 60) {
		return i18nTime.t('relativeTime', {
			v: -seconds,
			range: 'seconds',
			numeric: 'auto',
		});
	} else if (minutes < 60) {
		return i18nTime.t('relativeTime', {
			v: -minutes,
			range: 'minute',
			numeric: 'auto',
		});
	} else if (hours < 24) {
		return i18nTime.t('relativeTime', {
			v: -hours,
			range: 'hour',
			numeric: 'auto',
		});
	} else if (days < 10) {
		return i18nTime.t('relativeTime', {
			v: -days,
			range: 'day',
			numeric: 'auto',
		});
	} else if (isThisYear) {
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

export const openURL = async (url: string): Promise<boolean> => {
	const supported = await Linking.canOpenURL(url);
	try {
		if (supported) {
			await Linking.openURL(url);
			return true;
		} else {
			console.log('Cannot open url: ', url);
			return false;
		}
	} catch (e) {
		console.log('Cannot open url: ', url);
		console.error('Error open url: ', e);
		return false;
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

		for (let i of weekDays) {
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
	let min, max;
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

/**
 * Breaks a Uint8Array into smaller chunks of a given size
 * @param {Uint8Array} buffer
 * @param {number} chunkSize
 * @returns {Uint8Array[]}
 */
export const chunkUint8Array = (
	buffer: Uint8Array,
	chunkSize: number = 50000,
): Result<Uint8Array[]> => {
	if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
		return err('chunkSize must be a positive integer.');
	}
	let result: Uint8Array[] = [];
	try {
		for (let i = 0; i < buffer.length; i += chunkSize) {
			let chunk = new Uint8Array(buffer.buffer.slice(i, i + chunkSize));
			result.push(chunk);
		}
	} catch (e) {
		return err(e);
	}
	return ok(result);
};
