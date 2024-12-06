const { install } = require('react-native-quick-crypto');

// Patch global.crypto with quickcrypto and global.Buffer with react-native-buffer.
install();

// Polyfill TextDecoder (TextEncoder is already supported by hermes)
require('./src/polyfills/textdecoder-polyfill');

// RN still doesn't support full spec of Intl API
// Don't remove -force from these because detection is VERY slow on low-end Android.
// https://github.com/formatjs/formatjs/issues/4463#issuecomment-2176070577
if (!Intl.Locale) {
	require('@formatjs/intl-locale/polyfill-force');
}
if (!NumberFormat.formatToParts) {
	require('@formatjs/intl-numberformat/polyfill-force');
	require('@formatjs/intl-numberformat/locale-data/en');
	require('@formatjs/intl-numberformat/locale-data/ru');
}
if (!Intl.PluralRules) {
	require('@formatjs/intl-pluralrules/polyfill-force');
	require('@formatjs/intl-pluralrules/locale-data/en');
	require('@formatjs/intl-pluralrules/locale-data/ru');
}
if (!Intl.RelativeTimeFormat) {
	require('@formatjs/intl-relativetimeformat/polyfill-force');
	require('@formatjs/intl-relativetimeformat/locale-data/en');
	require('@formatjs/intl-relativetimeformat/locale-data/ru');
}

if (!Symbol.asyncIterator) {
	Symbol.asyncIterator = '@@asyncIterator';
}
if (!Symbol.iterator) {
	Symbol.iterator = '@@iterator';
}
