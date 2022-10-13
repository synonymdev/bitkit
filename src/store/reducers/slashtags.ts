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
		case actions.SET_LINKS: {
			return {
				...state,
				links: action.payload,
			};
		}
		case actions.ADD_LINK: {
			return {
				...state,
				links: [...state.links, action.payload],
			};
		}
		case actions.EDIT_LINK: {
			return {
				...state,
				links: state.links.map((link) => {
					return link.id === action.payload.id ? action.payload : link;
				}),
			};
		}
		case actions.DELETE_LINK: {
			return {
				...state,
				links: state.links.filter((link) => link.id !== action.payload),
			};
		}
		case actions.CACHE_PROFILE: {
			return {
				...state,
				profiles: {
					...state.profiles,
					[action.payload.url]: {
						fork: action.payload.fork,
						version: action.payload.version,
						profile: action.payload.profile,
					},
				},
			};
		}
		default:
			return state;
	}
};

export default slashtags;
