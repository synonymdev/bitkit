import Store from '../types';
import { IReceive } from '../types/receive';

export const receiveSelector = (state: Store): IReceive => state.receive;
