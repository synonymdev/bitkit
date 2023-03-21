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

		case actions.IGNORE_APP_UPDATE:
			return {
				...state,
				ignoreAppUpdateTimestamp: Number(new Date()),
			};

		case actions.IGNORE_BACKUP:
			return {
				...state,
				ignoreBackupTimestamp: Number(new Date()),
			};

		case actions.IGNORE_HIGH_BALANCE: {
			const increment = action.payload.final ? 3 : 1;
			return {
				...state,
				ignoreHighBalanceCount: state.ignoreHighBalanceCount + increment,
				ignoreHighBalanceTimestamp: Number(new Date()),
			};
		}

		case actions.START_COOP_CLOSE_TIMER:
			return {
				...state,
				startCoopCloseTimestamp: Number(new Date()),
			};

		case actions.CLEAR_COOP_CLOSE_TIMER:
			return {
				...state,
				startCoopCloseTimestamp: 0,
			};

		case actions.VERIFY_BACKUP:
			return {
				...state,
				backupVerified: true,
			};

		case actions.ACCEPT_BETA_RISK:
			return {
				...state,
				betaRiskAccepted: true,
			};

		case actions.RESET_USER_STORE:
			return defaultUserShape;

		default:
			return state;
	}
};

export default user;
