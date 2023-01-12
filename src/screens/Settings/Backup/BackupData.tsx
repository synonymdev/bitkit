import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
// import { useSelector } from 'react-redux';

import { View } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
// import { useSelectedSlashtag } from '../../../hooks/slashtags';
// import Store from '../../../store/types';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaView from '../../../components/SafeAreaView';
import GlowImage from '../../../components/GlowImage';
// import List, { EItemType, IListData } from '../../../components/List';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/folder.png');

const BackupData = ({
	navigation,
}: SettingsScreenProps<'BackupData'>): ReactElement => {
	// const { slashtag } = useSelectedSlashtag();
	// const [showDialog, setShowDialog] = useState(false);
	// const [isBackingUp, setIsBackingUp] = useState(false);
	// const pin = useSelector((state: Store) => state.settings.pin);
	// const { remoteBackupsEnabled, remoteLdkBackupLastSync } = useSelector(
	// 	(state: Store) => state.backup,
	// );

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
	// 	{
	// 		title: 'Other backup options',
	// 		data: [
	// 			{
	// 				title: 'Export to phone',
	// 				type: EItemType.button,
	// 				onPress: (): void => {
	// 					if (pin) {
	// 						navigation.navigate('AuthCheck', {
	// 							onSuccess: () => {
	// 								// hack needed for Android
	// 								setTimeout(() => {
	// 									navigation.replace('ExportToPhone');
	// 								}, 100);
	// 							},
	// 						});
	// 					} else {
	// 						navigation.navigate('ExportToPhone');
	// 					}
	// 				},
	// 			},
	// 			{
	// 				title: 'Store on iCloud',
	// 				type: EItemType.button,
	// 				onPress: (): void => Alert.alert('Coming soon'),
	// 			},
	// 			{
	// 				title: 'Store on Google Drive',
	// 				type: EItemType.button,
	// 				onPress: (): void => Alert.alert('Coming soon'),
	// 			},
	// 			{
	// 				title: 'Store on Dropbox',
	// 				type: EItemType.button,
	// 				onPress: (): void => Alert.alert('Coming soon'),
	// 			},
	// 		],
	// 	},
	// ];

	return (
		<SafeAreaView>
			<NavigationHeader
				title="Back Up Data"
				displayBackButton={true}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			{/* TODO: add scrolling on small screens */}

			<View style={styles.container}>
				<Text01S color="gray1">
					Your profile, contacts, accounts, tags, and activity will be encrypted
					and backed up automatically to our free cloud service.
				</Text01S>
				<GlowImage image={imageSrc} glowColor="green" />
				{/* <View>
					<List data={settingsListData} bounces={false} />
				</View> */}
			</View>

			{/* <Dialog
				visible={showDialog}
				title="Switch off automated backups?"
				description="Are you sure you want to stop automated backups? You won't be able to restore your data if your phone is lost or damaged."
				confirmText="Yes, switch off"
				onCancel={(): void => setShowDialog(false)}
				onConfirm={(): void => {
					setRemoteBackupsEnabled(false);
					setShowDialog(false);
				}}
			/> */}

			<SafeAreaInsets type="bottom" />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
});

export default memo(BackupData);
