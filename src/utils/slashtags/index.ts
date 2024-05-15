import { parse } from '@synonymdev/slashtags-url';
import { rootNavigation } from '../../navigation/root/RootNavigator';

/**
 * Handles pasting or scanning a slash:// url
 */
export const handleSlashtagURL = (
	url: string,
	onError?: (error: Error) => void,
	onSuccess?: (url: string) => void,
): void => {
	try {
		const parsed = parse(url);

		if (parsed.protocol === 'slash:') {
			rootNavigation.navigate('ContactEdit', { url });
		} else if (parsed.protocol === 'slashfeed:') {
			rootNavigation.navigate('Widget', { url });
		}

		onSuccess?.(url);
	} catch (error) {
		onError?.(error as Error);
	}
};
