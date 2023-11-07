import { TextEncoder, TextDecoder } from 'text-encoding';

/**
 * Convert readable string to bytes
 * @param str
 * @returns {Uint8Array}
 */
export const stringToBytes = (str: string): Uint8Array => {
	const encoder = new TextEncoder();
	return encoder.encode(str);
};

/**
 * Converts bytes to readable string
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export const bytesToString = (bytes: Uint8Array): string => {
	const decoder = new TextDecoder();
	return decoder.decode(bytes);
};
