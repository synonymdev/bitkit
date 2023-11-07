import { removeKeysFromObject } from '../../utils/helpers';
import actions from '../actions/actions';
import { defaultWidgetsShape } from '../shapes/widgets';
import { IWidgetsStore } from '../types/widgets';

const widgetsReducer = (
	state: IWidgetsStore = defaultWidgetsShape,
	action,
): IWidgetsStore => {
	switch (action.type) {
		case actions.UPDATE_WIDGETS:
			return {
				...state,
				...action.payload,
			};

		case actions.SET_AUTH_WIDGET: {
			const existing = state.widgets[action.payload.url] || {};

			return {
				...state,
				widgets: {
					...state.widgets,
					[action.payload.url]: {
						...existing,
						magiclink: action.payload.magiclink,
					},
				},
				sortOrder: [...state.sortOrder, action.payload.url],
			};
		}

		case actions.SET_FEED_WIDGET: {
			return {
				...state,
				sortOrder: [...state.sortOrder, action.payload.url],
				widgets: {
					...state.widgets,
					[action.payload.url]: {
						type: action.payload.type,
						fields: action.payload.fields,
						extras: action.payload.extras,
					},
				},
			};
		}

		case actions.DELETE_WIDGET: {
			const widgets = removeKeysFromObject(state.widgets, action.payload.url);
			const sortOrder = state.sortOrder.filter((i) => i !== action.payload.url);

			return {
				...state,
				widgets,
				sortOrder,
			};
		}

		case actions.SET_WIDGETS_ONBOARDING: {
			return {
				...state,
				onboardedWidgets: action.payload.onboardedWidgets,
			};
		}

		case actions.SET_WIDGETS_SORT_ORDER: {
			return {
				...state,
				sortOrder: action.payload.sortOrder,
			};
		}

		case actions.RESET_WIDGETS_STORE: {
			return defaultWidgetsShape;
		}

		default: {
			return state;
		}
	}
};

export default widgetsReducer;
