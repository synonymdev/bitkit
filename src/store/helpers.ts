import cloneDeep from 'lodash/cloneDeep';

import store, { RootState } from '../store';
import { TActivity } from './slices/activity';
import { TFeesState } from './slices/fees';
import { TSettings } from './slices/settings';
import { TUser } from './slices/user';
import { TWidgetsState } from './slices/widgets';
import { TBackupState } from './types/backup';
import { IBlocktank } from './types/blocktank';
import { IChecksShape } from './types/checks';
import { TLightningState } from './types/lightning';
import { TMetadataState } from './types/metadata';
import { TSlashtagsState } from './types/slashtags';
import { TTodosState } from './types/todos';
import { TUiState } from './types/ui';
import { IWalletStore } from './types/wallet';

/*
Used to retrieve the store outside of a component.
 */
export const getStore = (): RootState => {
	return cloneDeep(store.getState());
};
export const getWalletStore = (): IWalletStore => {
	return cloneDeep(store.getState().wallet);
};

export const getSettingsStore = (): TSettings => {
	return cloneDeep(store.getState().settings);
};

export const getMetaDataStore = (): TMetadataState => {
	return cloneDeep(store.getState().metadata);
};

export const getActivityStore = (): TActivity => {
	return cloneDeep(store.getState().activity);
};

export const getLightningStore = (): TLightningState => {
	return cloneDeep(store.getState().lightning);
};

export const getBlocktankStore = (): IBlocktank => {
	return cloneDeep(store.getState().blocktank);
};

export const getFeesStore = (): TFeesState => {
	return cloneDeep(store.getState().fees);
};

export const getSlashtagsStore = (): TSlashtagsState => {
	return cloneDeep(store.getState().slashtags);
};

export const getTodosStore = (): TTodosState => {
	return cloneDeep(store.getState().todos);
};

export const getUiStore = (): TUiState => {
	return cloneDeep(store.getState().ui);
};

export const getUserStore = (): TUser => {
	return cloneDeep(store.getState().user);
};

export const getWidgetsStore = (): TWidgetsState => {
	return cloneDeep(store.getState().widgets);
};

export const getChecksStore = (): IChecksShape => {
	return cloneDeep(store.getState().checks);
};

export const getBackupStore = (): TBackupState => {
	return cloneDeep(store.getState().backup);
};

/*
Used to dispatch outside of a component.
 */
export const { dispatch } = store;
