import actions from '../actions/actions';
import { ITodos } from '../types/todos';
import { defaultTodosShape } from '../shapes/todos';

const todos = (state: ITodos = defaultTodosShape, action): ITodos => {
	switch (action.type) {
		case actions.HIDE_TODO: {
			return {
				...state,
				hide: {
					...state.hide,
					[action.payload]: +new Date(),
				},
			};
		}

		case actions.RESET_HIDDEN_TODOS: {
			return {
				...state,
				hide: {},
			};
		}

		case actions.CHANNEL_NOTIFICATION_SHOWN: {
			// remove everything older than 1 day
			const newChannelsNotifications = Object.keys(
				state.newChannelsNotifications,
			).reduce((acc, key) => {
				if (
					state.newChannelsNotifications[key] <
					+new Date() - 24 * 60 * 60 * 1000
				) {
					return acc;
				}

				return {
					...acc,
					[key]: state.newChannelsNotifications[key],
				};
			}, {});

			// mark new notifications as shown
			action.payload.forEach((channelId: string) => {
				newChannelsNotifications[channelId] = +new Date();
			});

			return {
				...state,
				newChannelsNotifications,
			};
		}

		case actions.RESET_TODOS: {
			return defaultTodosShape;
		}

		default: {
			return state;
		}
	}
};

export default todos;
