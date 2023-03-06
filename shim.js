if (typeof __dirname === 'undefined') {
	global.__dirname = '/';
}
if (typeof __filename === 'undefined') {
	global.__filename = '';
}
if (typeof process === 'undefined') {
	global.process = require('process');
} else {
	const bProcess = require('process');
	for (var p in bProcess) {
		if (!(p in process)) {
			process[p] = bProcess[p];
		}
	}
}

process.browser = false;
if (typeof Buffer === 'undefined') {
	global.Buffer = require('buffer').Buffer;
}

global.net = require('./src/utils/electrum/net');
global.tls = require('./src/utils/electrum/tls');

// global.location = global.location || { port: 80 }
const isDev = typeof __DEV__ === 'boolean' && __DEV__;
process.env = {
	...process.env,
	NODE_ENV: isDev ? 'development' : 'production',
};
if (typeof localStorage !== 'undefined') {
	localStorage.debug = isDev ? '*' : '';
}

// If using the crypto shim, uncomment the following line to ensure
// crypto is loaded first, so it can populate global.crypto
require('crypto');

// Intl JS api
if (typeof Intl === 'undefined') {
	require('@formatjs/intl-getcanonicallocales/polyfill');
	require('@formatjs/intl-locale/polyfill');
	require('@formatjs/intl-pluralrules/polyfill');
	require('@formatjs/intl-pluralrules/locale-data/en');
	require('@formatjs/intl-pluralrules/locale-data/ru');
	require('@formatjs/intl-numberformat/polyfill');
	require('@formatjs/intl-numberformat/locale-data/en');
	require('@formatjs/intl-numberformat/locale-data/ru');
	require('@formatjs/intl-datetimeformat/polyfill');
	require('@formatjs/intl-datetimeformat/locale-data/en');
	require('@formatjs/intl-datetimeformat/locale-data/ru');
	require('@formatjs/intl-datetimeformat/add-all-tz');
	require('@formatjs/intl-relativetimeformat/polyfill');
	require('@formatjs/intl-relativetimeformat/locale-data/en');
	require('@formatjs/intl-relativetimeformat/locale-data/ru');
}
