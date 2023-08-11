// NOTE: 'receive' reducer is not persisted to storage

import { IReceive } from '../types/receive';

export const defaultReceiveShape: IReceive = {
	amount: 0,
	numberPadText: '',
	message: '',
	tags: [],
};
