import { MMKV } from 'react-native-mmkv';
import { receivedTxIds } from './received-tx-cache';
import { reduxStorage } from './redux-storage';
import { WebRelayCache } from './webrelay-cache';
import { widgetsCache } from './widgets-cache';

export const storage = new MMKV();

export { reduxStorage, receivedTxIds, WebRelayCache, widgetsCache };
