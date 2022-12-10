import actions from '../actions/actions';
import { defaultFeesShape } from '../shapes/fees';
import { IFees } from '../types/fees';

const fees = (state: IFees = defaultFeesShape, action): IFees => {
	switch (action.type) {
		case actions.UPDATE_FEES:
			return {
				...state,
				...action.payload,
			};

		case actions.UPDATE_ONCHAIN_FEE_ESTIMATES:
			return {
				...state,
				onchain: {
					...state.onchain,
					timestamp: Date.now(),
					...action.payload,
				},
			};

		case actions.RESET_FEES_STORE:
			return defaultFeesShape;

		default:
			return state;
	}
};

export default fees;
