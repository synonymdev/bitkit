import { Dispatch } from 'redux';
import cloneDeep from 'lodash/cloneDeep';

import store from '../store';
import Store, { EStore } from './types';
import { IWalletStore } from './types/wallet';
import { ISettings } from './types/settings';
import { IMetadata } from './types/metadata';
import { IActivity } from './types/activity';
import { ILightning } from './types/lightning';
import { IBlocktank } from './types/blocktank';
import { IFees } from './types/fees';
import { ISlashtags } from './types/slashtags';
import { ITodos } from './types/todos';
import { IUi } from './types/ui';
import { IUser } from './types/user';
import { IWidgetsStore } from './types/widgets';
import { IChecksShape } from './types/checks';
import { IBackup } from './types/backup';

/*
Used to retrieve the store outside of a component.
 */
export const getStore = (): Store => {
	return cloneDeep(store.getState());
};
export const getWalletStore = (): IWalletStore => {
	return cloneDeep(store.getState()[EStore.wallet]);
};

export const getSettingsStore = (): ISettings => {
	return cloneDeep(store.getState()[EStore.settings]);
};

export const getMetaDataStore = (): IMetadata => {
	return cloneDeep(store.getState()[EStore.metadata]);
};

export const getActivityStore = (): IActivity => {
	return cloneDeep(store.getState()[EStore.activity]);
};

export const getLightningStore = (): ILightning => {
	return cloneDeep(store.getState()[EStore.lightning]);
};

export const getBlocktankStore = (): IBlocktank => {
	return cloneDeep(store.getState()[EStore.blocktank]);
};

export const getFeesStore = (): IFees => {
	return cloneDeep(store.getState()[EStore.fees]);
};

export const getSlashtagsStore = (): ISlashtags => {
	return cloneDeep(store.getState()[EStore.slashtags]);
};

export const getTodosStore = (): ITodos => {
	return cloneDeep(store.getState()[EStore.todos]);
};

export const getUiStore = (): IUi => {
	return cloneDeep(store.getState()[EStore.ui]);
};

export const getUserStore = (): IUser => {
	return cloneDeep(store.getState()[EStore.user]);
};

export const getWidgetsStore = (): IWidgetsStore => {
	return cloneDeep(store.getState()[EStore.widgets]);
};

export const getChecksStore = (): IChecksShape => {
	return cloneDeep(store.getState()[EStore.checks]);
};

export const getBackupStore = (): IBackup => {
	return cloneDeep(store.getState()[EStore.backup]);
};

/*
Used to get dispatch outside of a component.
 */
export const getDispatch = (): Dispatch<any> => store.dispatch;
