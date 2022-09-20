import actions from '../actions/actions';
import { IUi } from '../types/ui';
import { defaultUiShape } from '../shapes/ui';

const ui = (state: IUi = defaultUiShape, action): IUi => {
	switch (action.type) {
		case actions.UPDATE_PROFILE_LINK:
			return { ...state, profileLink: action.payload };

		case actions.RESET_UI_STORE:
			return { ...defaultUiShape };

		default:
			return state;
	}
};

export default ui;
