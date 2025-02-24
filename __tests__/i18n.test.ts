import i18n, { i18nTime } from '../src/utils/i18n';
import convert from '../src/utils/i18n/convert';

describe('Internationalization', () => {
	it('can translate', async () => {
		expect(i18n.t('wallet:activity_input', { count: 1 })).toEqual('INPUT');
		expect(i18n.t('wallet:activity_input', { count: 3 })).toEqual('INPUTS (3)');

		i18n.changeLanguage('ru');
		expect(i18n.t('wallet:activity_input', { count: 1 })).toEqual('ВВОД');
		expect(i18n.t('wallet:activity_input', { count: 3 })).toEqual('ВВОДЫ (3)');

		// time
		expect(
			i18nTime.t('dateTime', {
				v: new Date(1720609322336),
				formatParams: {
					v: {
						month: 'long',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
					},
				},
			}),
		).toContain('July 10');

		i18nTime.changeLanguage('ru');
		expect(
			i18nTime.t('dateTime', {
				v: new Date(1720609322336),
				formatParams: {
					v: {
						month: 'long',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
					},
				},
			}),
		).toContain('10 июля');
	});

	it('can convert Structured JSON to Key Value JSON', () => {
		const structured = {
			en: {
				lev1: {
					lev2: {
						string: 'hello',
						context: 'context',
						character_limit: 1,
					},
				},
			},
		};

		const keyValue = {
			en: {
				lev1: {
					lev2: 'hello',
				},
			},
		};

		expect(convert(structured)).toEqual(keyValue);
	});
});
