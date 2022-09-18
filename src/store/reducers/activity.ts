import actions from '../actions/actions';
import { IActivity } from '../types/activity';
import { defaultActivityShape } from '../shapes/activity';
import { mergeActivityItems } from '../../utils/activity';

const activity = (
	state: IActivity = defaultActivityShape,
	action,
): IActivity => {
	switch (action.type) {
		case actions.UPDATE_ACTIVITY_ENTRIES:
			const items = mergeActivityItems(state.items, action.payload);
			return {
				...state,
				items,
			};
		case actions.REPLACE_ACTIVITY_ITEM:
			return {
				...state,
				items: action.payload,
			};
		case actions.RESET_ACTIVITY_STORE:
			return { ...defaultActivityShape };
		default:
			return state;
	}
};

export default activity;
