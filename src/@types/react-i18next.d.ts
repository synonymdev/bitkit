// import resources from '../utils/i18n/locales'; // TODO
import { defaultNS } from '../utils/i18n';

declare module 'react-i18next' {
	interface CustomTypeOptions {
		defaultNS: typeof defaultNS;
		// resources: typeof resources['en'];
	}
}
