import 'i18next';
// import resources from '../utils/i18n/locales'; // TODO
import { defaultNS } from '../utils/i18n';

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: typeof defaultNS;
		returnNull: false;
		// resources: typeof resources['en']; // TODO
	}
}
