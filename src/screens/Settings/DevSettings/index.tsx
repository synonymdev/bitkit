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
import { resetWidgetsStore } from '../../../store/actions/widgets';
import actions from '../../../store/actions/actions';
import { resetFeesStore } from '../../../store/actions/fees';
import type { SettingsScreenProps } from '../../../navigation/types';

const DevSettings = ({
	navigation,
}: SettingsScreenProps<'DevSettings'>): ReactElement => {
	const dispatch = useDispatch();
	const [throwError, setThrowError] = useState(false);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'Slashtags',
				data: [
					{
						title: 'Slashtags Settings',
						type: 'button',
						onPress: (): void => navigation.navigate('SlashtagsSettings'),
					},
				],
			},
			{
				title: 'App Cache',
				data: [
					{
						title: 'Reset Current Wallet Store',
						type: 'button',
						onPress: async (): Promise<void> => {
							await resetSelectedWallet({ selectedWallet });
						},
					},
					{
						title: 'Reset Entire Wallet Store',
						type: 'button',
						onPress: resetWalletStore,
					},
					{
						title: 'Reset Lightning Store',
						type: 'button',
						onPress: resetLightningStore,
					},
					{
						title: 'Reset Fees Store',
						type: 'button',
						onPress: resetFeesStore,
					},
					{
						title: 'Reset Settings Store',
						type: 'button',
						onPress: resetSettingsStore,
					},
					{
						title: 'Reset Activity Store',
						type: 'button',
						onPress: resetActivityStore,
					},
					{
						title: 'Reset User Store',
						type: 'button',
						onPress: resetUserStore,
					},
					{
						title: 'Reset Blocktank Store',
						type: 'button',
						onPress: resetBlocktankStore,
					},
					{
						title: 'Reset Slashtags Store',
						type: 'button',
						onPress: resetSlashtagsStore,
					},
					{
						title: 'Reset Widgets Store',
						type: 'button',
						onPress: resetWidgetsStore,
					},
					{
						title: 'Reset All Stores',
						type: 'button',
						onPress: (): void => {
							dispatch({ type: actions.WIPE_APP });
						},
					},
					{
						title: 'Wipe App',
						type: 'button',
						onPress: wipeApp,
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
					},
					{
						title: 'Trigger exception in action handler',
						type: 'button',
						onPress: (): void => {
							throw new Error('test action error');
						},
					},
					{
						title: 'Trigger unhandled async exception',
						type: 'button',
						onPress: async (): Promise<void> => {
							throw new Error('test async error');
						},
					},
				],
			},
		],
		[dispatch, navigation, selectedWallet],
	);

	if (throwError) {
		throw new Error('test render error');
	}

	return (
		<SettingsView
			title="Dev Settings"
			listData={settingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(DevSettings);
