import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import { __ENABLE_I18NEXT_DEBUGGER__ } from '../../constants/env';
import resources from './locales';
import { updateUi } from '../../store/actions/ui';

const getDeviceLanguage = (): string => {
	return RNLocalize.getLocales()[0].languageTag;
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
		debug: __ENABLE_I18NEXT_DEBUGGER__,
		cache: {
			enabled: true,
		},
		interpolation: {
			escapeValue: false,
		},
		returnNull: false,
	})
	.then(() => {
		let timeZone = RNLocalize.getTimeZone();

		// if polyfill is used, we need to set default timezone
		// https://formatjs.io/docs/polyfills/intl-datetimeformat/#default-timezone
		if ('__setDefaultTimeZone' in Intl.DateTimeFormat) {
			// formatjs doesn't know GMT, that is used by default in github actions
			if (timeZone === 'GMT') {
				timeZone = 'Etc/GMT';
			}

			try {
				// @ts-ignore __setDefaultTimeZone doesn't exist in native API
				Intl.DateTimeFormat.__setDefaultTimeZone(timeZone);
			} catch (e) {
				console.log(`error settings timezone to: ${timeZone} fallback to UTC`);
				// @ts-ignore __setDefaultTimeZone doesn't exist in native API
				Intl.DateTimeFormat.__setDefaultTimeZone('UTC');
				timeZone = 'UTC';
			}
		}

		updateUi({ timeZone, language: i18n.language });
	});

export default i18n;
