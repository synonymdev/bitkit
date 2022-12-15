import { removeKeysFromObject } from '../../utils/helpers';
import actions from '../actions/actions';
import { defaultWidgetsShape } from '../shapes/widgets';
import { IWidgets } from '../types/widgets';

const slashtags = (state: IWidgets = defaultWidgetsShape, action): IWidgets => {
	switch (action.type) {
		case actions.SET_SLASHTAGS_AUTH_WIDGET: {
			const existing = state.widgets[action.payload.url] || { feed: {} };

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

		case actions.SET_SLASHTAGS_FEED_WIDGET: {
			const existing = state.widgets[action.payload.url] || { feed: {} };

			return {
				...state,
				widgets: {
					...state.widgets,
					[action.payload.url]: {
						...existing,
						feed: {
							...existing.feed,
							...action.payload.feed,
						},
					},
				},
				sortOrder: [...state.sortOrder, action.payload.url],
			};
		}

		case actions.DELETE_SLASHTAGS_WIDGET: {
			const widgets = removeKeysFromObject(state.widgets, action.payload.url);
			const sortOrder = state.sortOrder.filter((i) => i !== action.payload.url);

			return {
				...state,
				widgets,
				sortOrder,
			};
		}

		case actions.SET_WIDGETS_ONBAORDING: {
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

export default slashtags;
