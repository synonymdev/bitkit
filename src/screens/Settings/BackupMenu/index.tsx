import React, { memo, ReactElement, useMemo } from 'react';
import { Alert } from 'react-native';
import { IListData } from '../../../components/List';
import SettingsView from './../SettingsView';
import { toggleView } from '../../../store/actions/user';
import { SettingsScreenProps } from '../../../navigation/types';

const BackupMenu = ({
	navigation,
}: SettingsScreenProps<'BackupMenu'>): ReactElement => {
	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Backup your money',
						type: 'button',
						onPress: (): void => {
							toggleView({
								view: 'backupPrompt',
								data: { isOpen: false },
							});
							toggleView({
								view: 'backupNavigation',
								data: { isOpen: true },
							});
						},
						hide: false,
					},
					{
						title: 'Backup your data',
						type: 'button',
						onPress: (): void => navigation.navigate('BackupData'),
						enabled: true,
						hide: false,
					},
					{
						title: 'Reset and restore wallet',
						type: 'button',
						onPress: (): void => {
							Alert.alert('Coming soon', '', []);
						},
						enabled: true,
						hide: false,
					},
				],
			},
		],
		[navigation],
	);

	return (
		<SettingsView
			title={'Back Up Or Restore'}
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(BackupMenu);
