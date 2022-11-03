import actions from '../actions/actions';
import { defaultWidgetsShape } from '../shapes/widgets';
import { IWidgets } from '../types/widgets';

const slashtags = (state: IWidgets = defaultWidgetsShape, action): IWidgets => {
	const existing = state.widgets[action?.payload?.url] || {};

	switch (action.type) {
		case actions.RESET_WIDGETS_STORE:
			return defaultWidgetsShape;

		case actions.SET_SLASHTAGS_AUTH_WIDGET:
			return {
				...state,
				widgets: {
					...state.widgets,
					[action.payload.url]: {
						...existing,
						magiclink: action.payload.magiclink,
					},
				},
			};

		case actions.SET_SLASHTAGS_FEED_WIDGET:
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
			};

		case actions.DELETE_SLASHTAGS_WIDGET:
			const widgets = { ...state.widgets };
			delete widgets[action.payload.url];

			return { ...state, widgets };

		case actions.SET_WIDGETS_ONBAORDING:
			return {
				...state,
				onboardedWidgets: action.payload.onboardedWidgets,
			};

		default:
			return state;
	}
};

export default slashtags;
