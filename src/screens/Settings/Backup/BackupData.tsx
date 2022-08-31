import React, { memo, ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';
import Store from '../../../store/types';
import SettingsView from '../SettingsView';
import { IListData } from '../../../components/List';
import {
	performFullBackup,
	setRemoteBackupsEnabled,
} from '../../../store/actions/backup';
import { useSelectedSlashtag } from '../../../hooks/slashtags';

const BackupData = ({ navigation }): ReactElement => {
	const { remoteBackupsEnabled } = useSelector((state: Store) => state.backup);

	const [isBackingUp, setIsBackingUp] = useState(false);

	const { slashtag } = useSelectedSlashtag(); //TODO this will backup using the current slashtag. Should we rather have a slashtag just for backups?

	const toggleRemoteBackup = async (): Promise<void> => {
		if (isBackingUp) {
			return;
		}

		if (remoteBackupsEnabled) {
			return Alert.alert(
				'Switch off automated backups?',
				"Are you sure you want to stop automated backups? You won't be able to restore your data if your phone is lost or damaged.",
				[
					{
						text: 'Yes, switch off',
						onPress: (): void => {
							setRemoteBackupsEnabled(false);
						},
					},
					{
						text: 'Cancel',
						onPress: (): void => {},
						style: 'cancel',
					},
				],
			);
		}

		setRemoteBackupsEnabled(true);
		setIsBackingUp(true);
		const res = await performFullBackup(slashtag);
		if (res.isErr()) {
			Alert.alert('Error backup up', res.error.message);
		} else {
			Alert.alert('Success', 'Backup up successful');
		}

		setIsBackingUp(false);
	};

	const SettingsListData: IListData[] = [
		{
			data: [
				{
					title: `Back up automatically ${isBackingUp ? '(Syncing...)' : ''}`,
					type: 'switch',
					onPress: toggleRemoteBackup,
					hide: false,
					enabled: remoteBackupsEnabled,
				},
				{
					title: 'Export to phone',
					type: 'button',
					onPress: (): void => navigation.navigate('ExportToPhone'),
					enabled: true,
					hide: false,
				},
				{
					title: 'Store on iCloud',
					type: 'button',
					onPress: (): void => Alert.alert('Coming soon'),
					enabled: true,
					hide: false,
				},
				{
					title: 'Store on Google Drive',
					type: 'button',
					onPress: (): void => Alert.alert('Coming soon'),
					enabled: true,
					hide: false,
				},
				{
					title: 'Store on Dropbox',
					type: 'button',
					onPress: (): void => Alert.alert('Coming soon'),
					enabled: true,
					hide: false,
				},
			],
		},
	];

	return (
		<SettingsView
			title={'Back Up Data'}
			listData={SettingsListData}
			showBackNavigation={true}
			childrenPosition={'bottom'}
		/>
	);
};

export default memo(BackupData);
