import { ok, err, Result } from '@synonymdev/result';
import SlashtagsProfile from '@synonymdev/slashtags-profile';

import i18n from '../i18n';
import { showToast } from '../notifications';
import { BasicProfile } from '../../store/types/slashtags';
import { cacheProfile2 } from '../../store/actions/slashtags';

export const saveProfile2 = async (
	url: string,
	profile: BasicProfile,
	slashtagsProfile: SlashtagsProfile,
): Promise<Result<string>> => {
	try {
		await slashtagsProfile.put(profile);
	} catch (e) {
		showToast({
			type: 'error',
			title: i18n.t('slashtags:error_saving_contact'),
			description: e.message,
		});
		return err(e);
	}

	cacheProfile2(url, profile);

	return ok('Profile saved');
};
