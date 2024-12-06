import en from './en';

import arb from './arb';
import ca from './ca';
import cs from './cs';
import de from './de';
import el from './el';
import es_419 from './es_419';
import es_ES from './es_ES';
import fa from './fa';
import fr from './fr';
import it from './it';
import ja from './ja';
import ko from './ko';
import nl from './nl';
import no from './no';
import pl from './pl';
import pt_BR from './pt_BR';
import pt_PT from './pt_PT';
import ro from './ro';
import ru from './ru';
import uk from './uk';
import yo from './yo';

export default {
	en,
	arb,
	ca,
	cs,
	de,
	el,
	es: es_419, // es_419 is the fallback for es because it's the most common variant
	'es-ES': es_ES,
	'es-419': es_419,
	fa,
	fr,
	it,
	ja,
	ko,
	nl,
	no,
	pl,
	pt: pt_BR, // pt_BR is the fallback for pt because it's the most common variant
	'pt-BR': pt_BR,
	'pt-PT': pt_PT,
	ro,
	ru,
	uk,
	yo,
} as const;

export const numberFormatPolyfills = {
	arb: (): any => import('@formatjs/intl-numberformat/locale-data/ar'),
	ca: (): any => import('@formatjs/intl-numberformat/locale-data/ca'),
	cs: (): any => import('@formatjs/intl-numberformat/locale-data/cs'),
	de: (): any => import('@formatjs/intl-numberformat/locale-data/de'),
	el: (): any => import('@formatjs/intl-numberformat/locale-data/el'),
	es: (): any => import('@formatjs/intl-numberformat/locale-data/es'),
	'es-ES': (): any => import('@formatjs/intl-numberformat/locale-data/es'),
	'es-419': (): any => import('@formatjs/intl-numberformat/locale-data/es-419'),
	fa: (): any => import('@formatjs/intl-numberformat/locale-data/fa'),
	fr: (): any => import('@formatjs/intl-numberformat/locale-data/fr'),
	it: (): any => import('@formatjs/intl-numberformat/locale-data/it'),
	ja: (): any => import('@formatjs/intl-numberformat/locale-data/ja'),
	ko: (): any => import('@formatjs/intl-numberformat/locale-data/ko'),
	nl: (): any => import('@formatjs/intl-numberformat/locale-data/nl'),
	no: (): any => import('@formatjs/intl-numberformat/locale-data/no'),
	pl: (): any => import('@formatjs/intl-numberformat/locale-data/pl'),
	pt: (): any => import('@formatjs/intl-numberformat/locale-data/pt'),
	'pt-BR': (): any => import('@formatjs/intl-numberformat/locale-data/pt'),
	'pt-PT': (): any => import('@formatjs/intl-numberformat/locale-data/pt-PT'),
	ro: (): any => import('@formatjs/intl-numberformat/locale-data/ro'),
	ru: (): any => import('@formatjs/intl-numberformat/locale-data/ru'),
	uk: (): any => import('@formatjs/intl-numberformat/locale-data/uk'),
	yo: (): any => import('@formatjs/intl-numberformat/locale-data/yo'),
};

export const pluralRulesPolyfills = {
	arb: (): any => import('@formatjs/intl-pluralrules/locale-data/ar'),
	ca: (): any => import('@formatjs/intl-pluralrules/locale-data/ca'),
	cs: (): any => import('@formatjs/intl-pluralrules/locale-data/cs'),
	de: (): any => import('@formatjs/intl-pluralrules/locale-data/de'),
	el: (): any => import('@formatjs/intl-pluralrules/locale-data/el'),
	es: (): any => import('@formatjs/intl-pluralrules/locale-data/es'),
	'es-ES': (): any => import('@formatjs/intl-pluralrules/locale-data/es'),
	'es-419': (): any => import('@formatjs/intl-pluralrules/locale-data/es'),
	fa: (): any => import('@formatjs/intl-pluralrules/locale-data/fa'),
	fr: (): any => import('@formatjs/intl-pluralrules/locale-data/fr'),
	it: (): any => import('@formatjs/intl-pluralrules/locale-data/it'),
	ja: (): any => import('@formatjs/intl-pluralrules/locale-data/ja'),
	ko: (): any => import('@formatjs/intl-pluralrules/locale-data/ko'),
	nl: (): any => import('@formatjs/intl-pluralrules/locale-data/nl'),
	no: (): any => import('@formatjs/intl-pluralrules/locale-data/no'),
	pl: (): any => import('@formatjs/intl-pluralrules/locale-data/pl'),
	pt: (): any => import('@formatjs/intl-pluralrules/locale-data/pt'),
	'pt-BR': (): any => import('@formatjs/intl-pluralrules/locale-data/pt'),
	'pt-PT': (): any => import('@formatjs/intl-pluralrules/locale-data/pt-PT'),
	ro: (): any => import('@formatjs/intl-pluralrules/locale-data/ro'),
	ru: (): any => import('@formatjs/intl-pluralrules/locale-data/ru'),
	uk: (): any => import('@formatjs/intl-pluralrules/locale-data/uk'),
	yo: (): any => import('@formatjs/intl-pluralrules/locale-data/yo'),
};

export const relativeTimeFormatPolyfills = {
	arb: (): any => import('@formatjs/intl-relativetimeformat/locale-data/ar'),
	ca: (): any => import('@formatjs/intl-relativetimeformat/locale-data/ca'),
	cs: (): any => import('@formatjs/intl-relativetimeformat/locale-data/cs'),
	de: (): any => import('@formatjs/intl-relativetimeformat/locale-data/de'),
	el: (): any => import('@formatjs/intl-relativetimeformat/locale-data/el'),
	es: (): any => import('@formatjs/intl-relativetimeformat/locale-data/es'),
	'es-ES': (): any =>
		import('@formatjs/intl-relativetimeformat/locale-data/es'),
	'es-419': (): any =>
		import('@formatjs/intl-relativetimeformat/locale-data/es-419'),
	fa: (): any => import('@formatjs/intl-relativetimeformat/locale-data/fa'),
	fr: (): any => import('@formatjs/intl-relativetimeformat/locale-data/fr'),
	it: (): any => import('@formatjs/intl-relativetimeformat/locale-data/it'),
	ja: (): any => import('@formatjs/intl-relativetimeformat/locale-data/ja'),
	ko: (): any => import('@formatjs/intl-relativetimeformat/locale-data/ko'),
	nl: (): any => import('@formatjs/intl-relativetimeformat/locale-data/nl'),
	no: (): any => import('@formatjs/intl-relativetimeformat/locale-data/no'),
	pl: (): any => import('@formatjs/intl-relativetimeformat/locale-data/pl'),
	pt: (): any => import('@formatjs/intl-relativetimeformat/locale-data/pt'),
	'pt-BR': (): any =>
		import('@formatjs/intl-relativetimeformat/locale-data/pt'),
	'pt-PT': (): any =>
		import('@formatjs/intl-relativetimeformat/locale-data/pt-PT'),
	ro: (): any => import('@formatjs/intl-relativetimeformat/locale-data/ro'),
	ru: (): any => import('@formatjs/intl-relativetimeformat/locale-data/ru'),
	uk: (): any => import('@formatjs/intl-relativetimeformat/locale-data/uk'),
	yo: (): any => import('@formatjs/intl-relativetimeformat/locale-data/yo'),
};
