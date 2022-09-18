import actions from '../actions/actions';
import { IUser } from '../types/user';
import { defaultUserShape } from '../shapes/user';

const user = (state: IUser = defaultUserShape, action): IUser => {
	switch (action.type) {
		case actions.UPDATE_USER:
			return {
				...state,
				...action.payload,
			};

		case actions.TOGGLE_VIEW:
			return {
				...state,
				viewController: {
					...state.viewController,
					[action.payload.view]: {
						...state.viewController[action.payload.view],
						...action.payload.data,
					},
				},
			};

		case actions.RESET_USER_STORE:
			return { ...defaultUserShape };

		case actions.USER_IGNORE_BACKUP:
			return {
				...state,
				ignoreBackupTimestamp: action.payload,
			};
		case actions.USER_VERIFY_BACKUP:
			return {
				...state,
				backupVerified: true,
			};

		default:
			return state;
	}
};

export default user;
