// NOTE: 'receive' reducer is not persisted to storage

import { IReceive } from '../types/receive';

export const defaultReceiveShape: IReceive = {
	id: '',
	amount: 0,
	numberPadText: '',
	message: '',
	tags: [],
	jitOrder: null,
};
