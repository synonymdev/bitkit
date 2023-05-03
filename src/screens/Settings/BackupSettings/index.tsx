import React, { ReactElement, ReactNode, memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { showBottomSheet } from '../../../store/actions/ui';
import { SettingsScreenProps } from '../../../navigation/types';
import Store from '../../../store/types';
import { Caption13M, Caption13Up, Text01M } from '../../../styles/text';
import {
	ScrollView,
	TouchableOpacity,
	View as ThemedView,
} from '../../../styles/components';
import { backupSelector } from '../../../store/reselect/backup';
import {
	ArrowClockwise,
	LightningHollow,
	NoteIcon,
	RectanglesTwo,
	SettingsIcon,
	TagIcon,
	TransferIcon,
	UsersIcon,
	UserRectangleIcon,
} from '../../../styles/icons';
import { FAILED_BACKUP_CHECK_TIME } from '../../../utils/backup/backups-subscriber';
import { updateBackup } from '../../../store/actions/backup';

const Status = ({
	Icon,
	title,
	isSyncedKey,
	lastSync,
	syncRequired,
}: {
	Icon: React.FunctionComponent<any>;
	title: ReactNode;
	isSyncedKey?: string;
	lastSync?: number;
	syncRequired?: number;
}): ReactElement => {
	const { t } = useTranslation('settings');
	const [hideRetry, setHideRetry] = useState<boolean>(false);

	const failed =
		syncRequired &&
		new Date().getTime() - syncRequired > FAILED_BACKUP_CHECK_TIME;

	let subtitle;
	if (failed) {
		subtitle = t('backup.status_failed', {
			time: t('intl:dateTime', {
				v: new Date(syncRequired),
				formatParams: {
					v: {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
					},
				},
			}),
		});
	} else if (lastSync) {
		subtitle = t('backup.status_success', {
			time: t('intl:dateTime', {
				v: new Date(lastSync),
				formatParams: {
					v: {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
					},
				},
			}),
		});
	} else {
		subtitle = t('backup.status_empty');
	}

	const retry = (): void => {
		if (isSyncedKey === undefined) {
			return;
		}
		setHideRetry(true);
		updateBackup({ [isSyncedKey]: false });
	};

	return (
		<View style={styles.status}>
			<View style={styles.iconContainer}>
				<ThemedView color={failed ? 'red16' : 'green16'} style={styles.icon}>
					<Icon width={16} height={16} color={failed ? 'red' : 'green'} />
				</ThemedView>
			</View>
			<View style={styles.desc}>
				<Text01M>{title}</Text01M>
				<Caption13M color="gray1">{subtitle}</Caption13M>
			</View>
			{failed && isSyncedKey && !hideRetry && (
				<TouchableOpacity onPress={retry} color="white08" style={styles.button}>
					<ArrowClockwise color="brand" width={16} height={16} />
				</TouchableOpacity>
			)}
		</View>
	);
};

const BackupSettings = ({
	navigation,
}: SettingsScreenProps<'BackupSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const pin = useSelector((state: Store) => state.settings.pin);
	const backup = useSelector(backupSelector);

	const categories = [
		{
			Icon: LightningHollow,
			title: t('backup.category_connections'),
			isSyncedKey: 'remoteLdkBackupSynced',
			lastSync: backup.remoteLdkBackupLastSync,
			syncRequired: backup.remoteLdkBackupLastSyncRequired,
		},
		{
			Icon: NoteIcon,
			title: t('backup.category_connection_receipts'),
			isSyncedKey: 'remoteBlocktankBackupSynced',
			lastSync: backup.remoteBlocktankBackupLastSync,
			syncRequired: backup.remoteBlocktankBackupSyncRequired,
		},
		{
			Icon: TransferIcon,
			title: t('backup.category_transaction_log'),
			isSyncedKey: 'remoteLdkActivityBackupSynced',
			lastSync: backup.remoteLdkActivityBackupLastSync,
			syncRequired: backup.remoteLdkActivityBackupSyncRequired,
		},
		{
			Icon: SettingsIcon,
			title: t('backup.category_settings'),
			isSyncedKey: 'remoteSettingsBackupSynced',
			lastSync: backup.remoteSettingsBackupLastSync,
			syncRequired: backup.remoteSettingsBackupSyncRequired,
		},
		{
			Icon: RectanglesTwo,
			title: t('backup.category_widgets'),
			isSyncedKey: 'remoteWidgetsBackupSynced',
			lastSync: backup.remoteWidgetsBackupLastSync,
			syncRequired: backup.remoteWidgetsBackupSyncRequired,
		},
		{
			Icon: TagIcon,
			title: t('backup.category_tags'),
			isSyncedKey: 'remoteMetadataBackupSynced',
			lastSync: backup.remoteMetadataBackupLastSync,
			syncRequired: backup.remoteMetadataBackupSyncRequired,
		},
		{
			Icon: UserRectangleIcon,
			title: t('backup.category_profile'),
			lastSync: backup.hyperProfileSeedCheckSuccess,
			syncRequired: backup.hyperProfileCheckRequested,
		},
		{
			Icon: UsersIcon,
			title: t('backup.category_contacts'),
			lastSync: backup.hyperContactsCheckSuccess,
			syncRequired: backup.hyperContactsCheckRequested,
		},
	];

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: t('backup.wallet'),
						type: EItemType.button,
						testID: 'BackupWallet',
						onPress: (): void => {
							showBottomSheet('backupNavigation');
						},
					},
					{
						title: t('backup.reset'),
						type: EItemType.button,
						enabled: true,
						testID: 'ResetAndRestore',
						onPress: (): void => {
							if (pin) {
								navigation.navigate('AuthCheck', {
									onSuccess: () => {
										// hack needed for Android
										setTimeout(() => {
											navigation.replace('ResetAndRestore');
										}, 100);
									},
								});
							} else {
								navigation.navigate('ResetAndRestore');
							}
						},
					},
					// {
					// 	title: t('backup.export'),
					// 	type: EItemType.button,
					// 	enabled: true,
					// 	testID: 'ExportToPhone',
					// 	onPress: (): void => {
					// 		navigation.navigate('ExportToPhone');
					// 	},
					// },
				],
			},
		],
		[navigation, pin, t],
	);

	return (
		<ThemedView style={styles.container}>
			<SettingsView
				title={t('backup.title')}
				listData={settingsListData}
				fullHeight={false}
				showBackNavigation={true}
			/>
			<ScrollView style={styles.statusRoot}>
				<Caption13Up style={styles.caption} color="gray1">
					{t('backup.latest')}
				</Caption13Up>
				{categories.map((c) => (
					<Status key={c.title} {...c} />
				))}
			</ScrollView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	caption: {
		marginLeft: 16,
		marginBottom: 12,
	},
	statusRoot: {
		flex: 1,
	},
	status: {
		marginHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		height: 56,
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconContainer: {
		marginRight: 16,
		alignItems: 'center',
	},
	icon: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 16,
		width: 32,
		height: 32,
	},
	desc: {
		flex: 1,
	},
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 40,
		height: 40,
		borderRadius: 20,
		marginLeft: 12,
	},
});

export default memo(BackupSettings);
