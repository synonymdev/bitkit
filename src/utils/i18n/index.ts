import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import * as RNLocalize from 'react-native-localize';

import { __ENABLE_I18NEXT_DEBUGGER__ } from '../../constants/env';
import resources from './locales';
import { updateUi } from '../../store/actions/ui';

const getDeviceLanguage = (): string => {
	const lang =
		RNLocalize.findBestLanguageTag(Object.keys(resources))?.languageTag ?? 'en';
	return lang;
};

export const defaultNS = 'common';

// this is a main instance of i18next that is used accross that app
// ICU is enabled to support plurals
const i18nICU = i18n.createInstance();
i18nICU
	.use(initReactI18next)
	.use(ICU)
	.init({
		lng: getDeviceLanguage(),
		fallbackLng: 'en',
		resources,
		defaultNS,
		fallbackNS: defaultNS,
		debug: __ENABLE_I18NEXT_DEBUGGER__,
		cache: { enabled: true },
		interpolation: { escapeValue: false },
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

export default i18nICU;

// this istance of i18next is used to format dates and relative time
export const i18nTime = i18n.createInstance();
i18nTime.init({
	lng: getDeviceLanguage(),
	fallbackLng: 'en',
	resources: {
		en: {
			intl: {
				dateTime: '{{v, datetime}}',
				relativeTime: '{{v, relativeTime}}',
			},
		},
	},
	defaultNS: 'intl',
	fallbackNS: 'intl',
	debug: __ENABLE_I18NEXT_DEBUGGER__,
	cache: { enabled: true },
	interpolation: { escapeValue: false },
	returnNull: false,
});
