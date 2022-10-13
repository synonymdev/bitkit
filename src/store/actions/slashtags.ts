import { Slashtag } from '@synonymdev/slashtags-sdk';
import { ok, Result } from '@synonymdev/result';

import actions from './actions';
import { getDispatch, getStore } from '../helpers';
import { BasicProfile, ISlashtags, Link, LocalLink } from '../types/slashtags';
import { seedDrives } from '../../utils/slashtags';

const dispatch = getDispatch();

/**
 * Sets the onboarding profile state.
 */
export const setOnboardingProfileStep = (
	step: ISlashtags['onboardingProfileStep'],
): Result<string> => {
	dispatch({
		type: actions.SET_ONBOARDING_PROFILE_STEP,
		step,
	});
	return ok('Set onboarding profile step to: ' + step);
};

/**
 * Set onboardedContacts state.
 */
export const setOnboardedContacts = (
	onboardedContacts = true,
): Result<string> => {
	dispatch({
		type: actions.SET_VISITED_CONTACTS,
		onboardedContacts,
	});
	return ok('Set onboardedContacts to: ' + onboardedContacts);
};

/**
 * Add a link to the profile
 */
export const setLinks = (links: LocalLink[]): Result<string> => {
	dispatch({ type: actions.SET_LINKS, payload: links });
	return ok('');
};

/**
 * Add a link to the profile
 */
export const addLink = ({ title, url }: Link): Result<string> => {
	dispatch({
		type: actions.ADD_LINK,
		payload: {
			id: `${title}:${url}`,
			title,
			url,
		},
	});
	return ok('');
};

/**
 * Edit a profile link
 */
export const editLink = (link: LocalLink): Result<string> => {
	dispatch({ type: actions.EDIT_LINK, payload: link });
	return ok('');
};

/**
 * Remove a link from the profile
 */
export const removeLink = (id: LocalLink['id']): Result<string> => {
	dispatch({ type: actions.DELETE_LINK, payload: id });
	return ok('');
};

/**
 * Resets slasthags store to the default state.
 */
export const resetSlashtagsStore = (): Result<string> => {
	dispatch({ type: actions.RESET_SLASHTAGS_STORE });
	return ok('Reset slashtags store successfully');
};

/**
 * Sends all relevant hypercores to the seeder once a week
 */
export const updateSeederMaybe = async (slashtag: Slashtag): Promise<void> => {
	const lastSent = getStore().slashtags.seeder?.lastSent || 0;

	const now = Number(new Date());
	// throttle sending to seeder to once a day
	const passed = (now - lastSent) / 86400000;

	if (passed < 1) {
		return;
	}

	const sent = await seedDrives(slashtag).catch(noop);

	if (sent) {
		console.debug('Sent hypercores to seeder');
		dispatch({
			type: actions.SET_LAST_SEEDER_REQUEST,
			time: now,
		});
	}
};

export const cacheProfile = (
	url: string,
	fork: number,
	version: number,
	profile: BasicProfile,
): void => {
	if (!profile || fork === null || fork === undefined || !version) {
		return;
	}

	const cached = getStore().slashtags.profiles?.[url];

	// If there is a cache mess, cache!
	if (!cached || (fork >= cached.fork && version > cached.version)) {
		dispatch({
			type: actions.CACHE_PROFILE,
			payload: { url, fork, version, profile },
		});
	}
};

function noop(): void {}
