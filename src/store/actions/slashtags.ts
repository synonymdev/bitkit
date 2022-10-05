import { Slashtag } from '@synonymdev/slashtags-sdk';
import { ok, Result } from '@synonymdev/result';
import { v4 as uuidv4 } from 'uuid';

import actions from './actions';
import { getDispatch, getStore } from '../helpers';
import { ISlashtags, Link } from '../types/slashtags';
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
export const setLinks = (links: Link[]): Result<string> => {
	dispatch({ type: actions.SET_LINKS, payload: links });
	return ok('');
};

/**
 * Add a link to the profile
 */
export const addLink = ({ title, url }: Omit<Link, 'id'>): Result<string> => {
	dispatch({
		type: actions.ADD_LINK,
		payload: {
			id: uuidv4(),
			title,
			url,
		},
	});
	return ok('');
};

/**
 * Edit a profile link
 */
export const editLink = (link: Link): Result<string> => {
	dispatch({ type: actions.EDIT_LINK, payload: link });
	return ok('');
};

/**
 * Remove a link from the profile
 */
export const removeLink = (id: Link['id']): Result<string> => {
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

function noop(): void {}
