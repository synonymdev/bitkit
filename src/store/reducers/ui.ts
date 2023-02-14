import actions from '../actions/actions';
import { IUi } from '../types/ui';
import { defaultUiShape, defaultViewControllers } from '../shapes/ui';

const ui = (state: IUi = defaultUiShape, action): IUi => {
	switch (action.type) {
		case actions.UPDATE_UI: {
			return {
				...state,
				...action.payload,
			};
		}

		case actions.SET_APP_UPDATE_TYPE:
			return {
				...state,
				availableUpdateType: action.payload,
			};

		case actions.SHOW_SHEET:
			return {
				...state,
				viewControllers: {
					...state.viewControllers,
					[action.payload.view]: {
						...action.payload.params,
						isOpen: true,
					},
				},
			};

		case actions.CLOSE_SHEET:
			return {
				...state,
				viewControllers: {
					...state.viewControllers,
					[action.payload]: defaultViewControllers[action.payload],
				},
			};

		case actions.UPDATE_PROFILE_LINK:
			return {
				...state,
				profileLink: {
					title: action.payload.title,
					url: action.payload.url ?? state.profileLink.url,
				},
			};

		case actions.RESET_UI_STORE:
			return defaultUiShape;

		default:
			return state;
	}
};

export default ui;
