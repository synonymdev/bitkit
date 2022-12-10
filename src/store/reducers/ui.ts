import actions from '../actions/actions';
import { IUi } from '../types/ui';
import { defaultUiShape, defaultViewControllers } from '../shapes/ui';

const ui = (state: IUi = defaultUiShape, action): IUi => {
	switch (action.type) {
		case actions.TOGGLE_VIEW:
			return {
				...state,
				viewControllers: {
					...state.viewControllers,
					[action.payload.view]: {
						...state.viewControllers[action.payload.view],
						...action.payload.data,
					},
				},
			};

		case actions.CLOSE_VIEWS:
			return {
				...state,
				viewControllers: defaultViewControllers,
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
