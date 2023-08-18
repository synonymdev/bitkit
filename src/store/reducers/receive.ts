import { v4 as uuidv4 } from 'uuid';
import actions from '../actions/actions';
import { IReceive } from '../types/receive';
import { defaultReceiveShape } from '../shapes/receive';

const receive = (state: IReceive = defaultReceiveShape, action): IReceive => {
	switch (action.type) {
		case actions.UPDATE_INVOICE: {
			const tags = action.payload.tags ?? [];
			return {
				...state,
				...action.payload,
				tags: [...new Set([...state.tags, ...tags])],
			};
		}

		case actions.RESET_INVOICE: {
			return { ...defaultReceiveShape, id: uuidv4() };
		}

		case actions.DELETE_INVOICE_TAG: {
			return {
				...state,
				tags: state.tags.filter((tag) => tag !== action.payload.tag),
			};
		}

		default: {
			return state;
		}
	}
};

export default receive;
