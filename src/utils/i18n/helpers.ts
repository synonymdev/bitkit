import i18n from '../i18n';

export const getRandomOkText = (): string => {
	const words = i18n.t('ok_random').split('\n');
	return words[Math.floor(Math.random() * words.length)];
};
