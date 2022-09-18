import actions from '../actions/actions';
import { defaultSlashtagsShape } from '../shapes/slashtags';
import { ISlashtags } from '../types/slashtags';

const slashtags = (
	state: ISlashtags = defaultSlashtagsShape,
	action,
): ISlashtags => {
	switch (action.type) {
		case actions.RESET_SLASHTAGS_STORE:
			return defaultSlashtagsShape;
		case actions.SET_ONBOARDING_PROFILE_STEP:
			return {
				...state,
				onboardingProfileStep: action.step,
			};
		case actions.SET_VISITED_CONTACTS:
			return {
				...state,
				onboardedContacts: action.onboardedContacts,
			};
		case actions.SET_LAST_SEEDER_REQUEST:
			return {
				...state,
				seeder: {
					...state.seeder,
					lastSent: action.time,
				},
			};
		default:
			return state;
	}
};

export default slashtags;
