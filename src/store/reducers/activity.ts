import actions from '../actions/actions';
import { IActivity } from '../types/activity';
import { defaultActivityShape } from '../shapes/activity';
import { mergeActivityItems } from '../../utils/activity';

const activity = (
	state: IActivity = defaultActivityShape,
	action,
): IActivity => {
	switch (action.type) {
		case actions.ADD_ACTIVITY_ITEM: {
			const items = state.items.filter((item) => item.id !== action.payload.id);

			return {
				...state,
				items: [action.payload, ...items],
			};
		}

		case actions.ADD_ACTIVITY_ITEMS: {
			return {
				...state,
				items: [...action.payload, ...state.items],
			};
		}

		case actions.UPDATE_ACTIVITY_ITEM: {
			const newItems = state.items.map((activityItem) => {
				if (activityItem.id === action.payload.id) {
					return { ...activityItem, ...action.payload.data };
				} else {
					return activityItem;
				}
			});

			return {
				...state,
				items: newItems,
			};
		}

		case actions.UPDATE_ACTIVITY_ITEMS: {
			const items = mergeActivityItems(state.items, action.payload);

			return {
				...state,
				items,
			};
		}

		case actions.RESET_ACTIVITY_STORE: {
			return defaultActivityShape;
		}

		default: {
			return state;
		}
	}
};

export default activity;
