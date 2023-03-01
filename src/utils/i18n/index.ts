import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform, NativeModules } from 'react-native';
import { ENABLE_I18NEXT_DEBUGGER } from '@env';

import resources from './locales';

const __enableDebugger__ = ENABLE_I18NEXT_DEBUGGER
	? ENABLE_I18NEXT_DEBUGGER === 'true'
	: __DEV__;

const getDeviceLanguage = (): string => {
	let language = '';
	try {
		if (Platform.OS === 'ios') {
			language =
				NativeModules.SettingsManager.settings.AppleLocale ||
				NativeModules.SettingsManager.settings.AppleLanguages[0];
		} else {
			language = NativeModules.I18nManager.localeIdentifier;
		}
	} catch (e) {
		language = 'en';
	}

	// Android returns specific locales that iOS does not i.e. en_US, en_GB.
	// If we want to support very specific locales we'll need to add a way to map them here.
	if (language.indexOf('_')) {
		language = language.split('_')[0];
	}

	console.info('language', language);

	return language;
};

export const defaultNS = 'common';

i18n
	.use(initReactI18next)
	.init({
		lng: getDeviceLanguage(),
		fallbackLng: 'en',
		compatibilityJSON: 'v3',
		resources,
		ns: Object.keys(resources),
		defaultNS,
		fallbackNS: defaultNS,
		debug: __enableDebugger__,
		cache: {
			enabled: true,
		},
		interpolation: {
			escapeValue: false,
		},
		returnNull: false,
	})
	.then();

export default i18n;
