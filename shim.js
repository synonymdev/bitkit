// Make sure crypto is loaded first, so it can populate global.crypto
// needed for sodium-javascript/randombytes.js
require('crypto');

// Polyfill TextEncoder/TextDecoder including TextEncoder().encodeInto
// https://github.com/anonyco/FastestSmallestTextEncoderDecoder
require('fastestsmallesttextencoderdecoder-encodeinto');

// RN still doesn't support full spec of Intl API
if (!Intl.Locale) {
	require('@formatjs/intl-locale/polyfill');
}
if (!NumberFormat.formatToParts) {
	require('@formatjs/intl-numberformat/polyfill');
	require('@formatjs/intl-numberformat/locale-data/en');
	require('@formatjs/intl-numberformat/locale-data/ru');
}
if (!Intl.PluralRules) {
	require('@formatjs/intl-pluralrules/polyfill');
	require('@formatjs/intl-pluralrules/locale-data/en');
	require('@formatjs/intl-pluralrules/locale-data/ru');
}
if (!Intl.RelativeTimeFormat) {
	require('@formatjs/intl-relativetimeformat/polyfill');
	require('@formatjs/intl-relativetimeformat/locale-data/en');
	require('@formatjs/intl-relativetimeformat/locale-data/ru');
}

if (!Symbol.asyncIterator) {
	Symbol.asyncIterator = '@@asyncIterator';
}
if (!Symbol.iterator) {
	Symbol.iterator = '@@iterator';
}
