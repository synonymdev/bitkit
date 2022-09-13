import React, { memo, ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet, Image, Alert } from 'react-native';

import Store from '../../../store/types';
import { View, Text01S } from '../../../styles/components';
import List, { IListData } from '../../../components/List';
import {
	performFullBackup,
	setRemoteBackupsEnabled,
} from '../../../store/actions/backup';
import { useSelectedSlashtag } from '../../../hooks/slashtags';
import Glow from '../../../components/Glow';
import NavigationHeader from '../../../components/NavigationHeader';
import type { SettingsScreenProps } from '../../../navigation/types';
import SafeAreaView from '../../../components/SafeAreaView';

const imageSrc = require('../../../assets/illustrations/folder.png');

const BackupData = ({
	navigation,
}: SettingsScreenProps<'BackupData'>): ReactElement => {
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

	const settingsListData: IListData[] = [
		{
			data: [
				{
					title: `Back up automatically ${isBackingUp ? '(Syncing...)' : ''}`,
					type: 'switch',
					onPress: toggleRemoteBackup,
					hide: false,
					enabled: remoteBackupsEnabled,
				},
			],
		},
		{
			title: 'Other backup options',
			data: [
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
		<SafeAreaView>
			<NavigationHeader
				title="Back Up Data"
				displayBackButton={true}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>

			<View style={styles.container}>
				<Text01S color="gray1">
					Back up your wallet first to avoid loss of your funds and wallet data.
					Resetting will overwrite your current Bitkit setup.
				</Text01S>

				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={600} color="green" />
					<Image source={imageSrc} style={styles.image} />
				</View>

				<List style={styles.list} data={settingsListData} bounces={false} />
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: 230,
		height: 230,
	},
	glow: {
		position: 'absolute',
	},
	list: {
		flex: 1,
	},
});

export default memo(BackupData);
