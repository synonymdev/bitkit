import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Store from '../../../store/types';
import { resetSettingsStore, wipeApp } from '../../../store/actions/settings';
import { IListData } from '../../../components/List';
import {
	resetSelectedWallet,
	resetWalletStore,
} from '../../../store/actions/wallet';
import { resetUserStore } from '../../../store/actions/user';
import { resetActivityStore } from '../../../store/actions/activity';
import { resetLightningStore } from '../../../store/actions/lightning';
import { resetBlocktankStore } from '../../../store/actions/blocktank';
import SettingsView from './../SettingsView';
import { resetSlashtagsStore } from '../../../store/actions/slashtags';
import actions from '../../../store/actions/actions';
import { resetFeesStore } from '../../../store/actions/fees';

const SettingsMenu = (): ReactElement => {
	const dispatch = useDispatch();
	const [throwError, setThrowError] = useState(false);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const rbf = useSelector((state: Store) => state.settings?.rbf ?? true);
	const hasPin = useSelector((state: Store) => state.settings.pin);

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'App Cache',
				data: [
					{
						title: 'Reset Current Wallet Store',
						type: 'button',
						onPress: async (): Promise<void> => {
							await resetSelectedWallet({ selectedWallet });
						},
						hide: false,
					},
					{
						title: 'Reset Entire Wallet Store',
						type: 'button',
						onPress: resetWalletStore,
						hide: false,
					},
					{
						title: 'Reset Lightning Store',
						type: 'button',
						onPress: resetLightningStore,
						hide: false,
					},
					{
						title: 'Reset Fees Store',
						type: 'button',
						onPress: resetFeesStore,
						hide: false,
					},
					{
						title: 'Reset Settings Store',
						type: 'button',
						onPress: resetSettingsStore,
						hide: false,
					},
					{
						title: 'Reset Activity Store',
						type: 'button',
						onPress: resetActivityStore,
						hide: false,
					},
					{
						title: 'Reset User Store',
						type: 'button',
						onPress: resetUserStore,
						hide: false,
					},
					{
						title: 'Reset Blocktank Store',
						type: 'button',
						onPress: resetBlocktankStore,
						hide: false,
					},
					{
						title: 'Reset Slashtags Store',
						type: 'button',
						onPress: resetSlashtagsStore,
						hide: false,
					},
					{
						title: 'Reset All Stores',
						type: 'button',
						onPress: (): void => {
							dispatch({ type: actions.WIPE_APP });
						},
						hide: false,
					},
					{
						title: 'Wipe App',
						type: 'button',
						onPress: wipeApp,
						hide: false,
					},
				],
			},
			{
				title: 'Debug',
				data: [
					{
						title: 'Trigger exception in React render',
						type: 'button',
						onPress: (): void => {
							setThrowError(true);
						},
						hide: false,
					},
					{
						title: 'Trigger exception in action handler',
						type: 'button',
						onPress: (): void => {
							throw new Error('test action error');
						},
						hide: false,
					},
					{
						title: 'Trigger unhandled async exception',
						type: 'button',
						onPress: async (): Promise<void> => {
							throw new Error('test async error');
						},
						hide: false,
					},
				],
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[hasPin, selectedWallet, rbf],
	);

	if (throwError) {
		throw new Error('test render error');
	}

	return (
		<SettingsView
			title={'Dev Settings'}
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(SettingsMenu);
