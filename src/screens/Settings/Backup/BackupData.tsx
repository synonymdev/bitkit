import React, { memo, ReactElement } from 'react';
import { StyleSheet, Image } from 'react-native';

import { View, Text01S } from '../../../styles/components';
import Glow from '../../../components/Glow';
import NavigationHeader from '../../../components/NavigationHeader';
import type { SettingsScreenProps } from '../../../navigation/types';
import SafeAreaView from '../../../components/SafeAreaView';

const imageSrc = require('../../../assets/illustrations/folder.png');

const BackupData = ({
	navigation,
}: SettingsScreenProps<'BackupData'>): ReactElement => {
	// const { remoteBackupsEnabled, remoteLdkBackupLastSync } = useSelector(
	// 	(state: Store) => state.backup,
	// );
	// const pin = useSelector((state: Store) => state.settings.pin);

	// const [isBackingUp, setIsBackingUp] = useState(false);
	// const [showDialog, setShowDialog] = useState(false);
	//
	// const { slashtag } = useSelectedSlashtag();

	// const toggleRemoteBackup = async (): Promise<void> => {
	// 	if (isBackingUp) {
	// 		return;
	// 	}
	//
	// 	if (remoteBackupsEnabled) {
	// 		setShowDialog(true);
	// 		return;
	// 	}
	//
	// 	setRemoteBackupsEnabled(true);
	// 	setIsBackingUp(true);
	// 	const res = await performFullBackup(slashtag);
	// 	if (res.isErr()) {
	// 		showErrorNotification({
	// 			title: 'Error Backing Up',
	// 			message: res.error.message,
	// 		});
	// 	} else {
	// 		showSuccessNotification({
	// 			title: 'Backup Successful',
	// 			message: 'Bitkit backed up your data.',
	// 		});
	// 	}
	//
	// 	setIsBackingUp(false);
	// };

	//TODO add back when functional
	// const settingsListData: IListData[] = [
	// 	{
	// 		data: [
	// 			{
	// 				title: `Back up automatically ${isBackingUp ? '(Syncing...)' : ''}`,
	// 				type: 'switch',
	// 				onPress: toggleRemoteBackup,
	// 				enabled: remoteBackupsEnabled,
	// 			},
	// 		],
	// 	},
	// {
	// 	title: 'Other backup options',
	// 	data: [
	// 		{
	// 			title: 'Export to phone',
	// 			type: 'button',
	// 			onPress: (): void => {
	// 				navigation.navigate('AuthCheck', {
	// 					onSuccess: () => {
	// 						setTimeout(() => {
	// 										navigation.replace('ExportToPhone');
	// 									}, 100);
	// 					},
	// 				});
	// 			},
	// 			enabled: true,
	// 		},
	// 		{
	// 			title: 'Store on iCloud',
	// 			type: 'button',
	// 			onPress: (): void => Alert.alert('Coming soon'),
	// 			enabled: true,
	// 		},
	// 		{
	// 			title: 'Store on Google Drive',
	// 			type: 'button',
	// 			onPress: (): void => Alert.alert('Coming soon'),
	// 			enabled: true,
	// 		},
	// 		{
	// 			title: 'Store on Dropbox',
	// 			type: 'button',
	// 			onPress: (): void => Alert.alert('Coming soon'),
	// 			enabled: true,
	// 		},
	// 	],
	// },
	// ];

	return (
		<SafeAreaView>
			<NavigationHeader
				title="Back Up Data"
				displayBackButton={true}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>

			{/* TODO: add scrolling on small screens */}

			<View style={styles.container}>
				<Text01S color="gray1">
					Transactions, accounts, contacts and tags will be backed up
					automagically. When you restore Bitkit with your recovery phrase, this
					data will be restored.
				</Text01S>

				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={600} color="green" />
					<Image source={imageSrc} style={styles.image} />
				</View>

				{/*<List style={styles.list} data={settingsListData} bounces={false} />*/}
			</View>

			{/*<Dialog*/}
			{/*	visible={showDialog}*/}
			{/*	title="Switch off automated backups?"*/}
			{/*	description="Are you sure you want to stop automated backups? You won't be able to restore your data if your phone is lost or damaged."*/}
			{/*	confirmText="Yes, switch off"*/}
			{/*	onCancel={(): void => setShowDialog(false)}*/}
			{/*	onConfirm={(): void => {*/}
			{/*		setRemoteBackupsEnabled(false);*/}
			{/*		setShowDialog(false);*/}
			{/*	}}*/}
			{/*/>*/}
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
});

export default memo(BackupData);
