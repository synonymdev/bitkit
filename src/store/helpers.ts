import { Dispatch } from 'redux';

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
import { IUi } from './types/ui';
import { IUser } from './types/user';
import { IWidgetsStore } from './types/widgets';
import cloneDeep from 'lodash.clonedeep';

/*
Used to retrieve the store outside of a component.
 */
export const getStore = (): Store => cloneDeep(store.getState());

export const getWalletStore = (): IWalletStore =>
	cloneDeep(store.getState()[EStore.wallet]);

export const getSettingsStore = (): ISettings =>
	cloneDeep(store.getState()[EStore.settings]);

export const getMetaDataStore = (): IMetadata =>
	cloneDeep(store.getState()[EStore.metadata]);

export const getActivityStore = (): IActivity =>
	cloneDeep(store.getState()[EStore.activity]);

export const getLightningStore = (): ILightning =>
	cloneDeep(store.getState()[EStore.lightning]);

export const getBlocktankStore = (): IBlocktank =>
	cloneDeep(store.getState()[EStore.blocktank]);

export const getFeesStore = (): IFees =>
	cloneDeep(store.getState()[EStore.fees]);

export const getSlashtagsStore = (): ISlashtags =>
	cloneDeep(store.getState()[EStore.slashtags]);

export const getUiStore = (): IUi => cloneDeep(store.getState()[EStore.ui]);

export const getUserStore = (): IUser =>
	cloneDeep(store.getState()[EStore.user]);

export const getWidgetsStore = (): IWidgetsStore =>
	cloneDeep(store.getState()[EStore.widgets]);

/*
Used to get dispatch outside of a component.
 */
export const getDispatch = (): Dispatch<any> => store.dispatch;
