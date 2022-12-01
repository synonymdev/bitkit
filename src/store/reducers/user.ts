import actions from '../actions/actions';
import { IUser } from '../types/user';
import { defaultUserShape, defaultViewControllers } from '../shapes/user';

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

		case actions.CLOSE_VIEWS:
			return {
				...state,
				viewController: defaultViewControllers,
			};

		case actions.USER_IGNORE_BACKUP:
			return {
				...state,
				ignoreBackupTimestamp: action.payload,
			};

		case actions.USER_IGNORE_HIGH_BALANCE:
			return {
				...state,
				ignoreHighBalanceCount: state.ignoreHighBalanceCount + 1,
				ignoreHighBalanceTimestamp: action.payload,
			};

		case actions.USER_START_COOP_CLOSE_TIMER:
			return {
				...state,
				startCoopCloseTimestamp: action.payload,
			};

		case actions.USER_IGNORE_APP_UPDATE:
			return {
				...state,
				ignoreAppUpdateTimestamp: action.payload,
			};

		case actions.USER_VERIFY_BACKUP:
			return {
				...state,
				backupVerified: true,
			};

		case actions.RESET_USER_STORE:
			return defaultUserShape;

		default:
			return state;
	}
};

export default user;
