import en from './en';

import arb from './arb';
import ca from './ca';
import cs from './cs';
import de from './de';
import el from './el';
import es_ES from './es_ES';
import es_419 from './es_419';
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
import ru from './ru';

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
	ru,
} as const;
