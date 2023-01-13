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

/*
Used to retrieve the store outside of a component.
 */
export const getStore = (): Store =>
	JSON.parse(JSON.stringify(store.getState()));

export const getWalletStore = (): IWalletStore =>
	JSON.parse(JSON.stringify(store.getState()[EStore.wallet]));

export const getSettingsStore = (): ISettings =>
	JSON.parse(JSON.stringify(store.getState()[EStore.settings]));

export const getMetaDataStore = (): IMetadata =>
	JSON.parse(JSON.stringify(store.getState()[EStore.metadata]));

export const getActivityStore = (): IActivity =>
	JSON.parse(JSON.stringify(store.getState()[EStore.activity]));

export const getLightningStore = (): ILightning =>
	JSON.parse(JSON.stringify(store.getState()[EStore.lightning]));

export const getBlocktankStore = (): IBlocktank =>
	JSON.parse(JSON.stringify(store.getState()[EStore.blocktank]));

export const getFeesStore = (): IFees =>
	JSON.parse(JSON.stringify(store.getState()[EStore.fees]));

export const getSlashtagsStore = (): ISlashtags =>
	JSON.parse(JSON.stringify(store.getState()[EStore.slashtags]));

export const getUiStore = (): IUi =>
	JSON.parse(JSON.stringify(store.getState()[EStore.ui]));

export const getUserStore = (): IUser =>
	JSON.parse(JSON.stringify(store.getState()[EStore.user]));

/*
Used to get dispatch outside of a component.
 */
export const getDispatch = (): Dispatch<any> => store.dispatch;
