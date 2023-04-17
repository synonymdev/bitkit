import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { closeBottomSheet, showBottomSheet } from '../../../store/actions/ui';
import { SettingsScreenProps } from '../../../navigation/types';
import Store from '../../../store/types';
import { Caption13Up, Text02S } from '../../../styles/text';
import { View as ThemedView } from '../../../styles/components';
import { backupSelector } from '../../../store/reselect/backup';

const BackupSettings = ({
	navigation,
}: SettingsScreenProps<'BackupSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const pin = useSelector((state: Store) => state.settings.pin);
	const backup = useSelector(backupSelector);

	const arr = [
		backup.remoteLdkBackupLastSync,
		backup.remoteSettingsBackupLastSync,
		backup.remoteWidgetsBackupLastSync,
		backup.remoteMetadataBackupLastSync,
		backup.remoteLdkActivityBackupLastSync,
		backup.remoteBlocktankBackupLastSync,
	].filter((i) => i !== undefined) as Array<number>;

	const max = Math.max(...arr);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: t('backup.money'),
						type: EItemType.button,
						onPress: (): void => {
							closeBottomSheet('backupPrompt');
							showBottomSheet('backupNavigation');
						},
						testID: 'BackupMoney',
					},
					{
						title: t('backup.data'),
						type: EItemType.button,
						enabled: true,
						onPress: (): void => {
							navigation.navigate('BackupData');
						},
						testID: 'BackupData',
					},
					{
						title: t('backup.reset'),
						type: EItemType.button,
						enabled: true,
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
						testID: 'ResetAndRestore',
					},
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
			<ThemedView style={styles.status}>
				<Caption13Up style={styles.caption} color="gray1">
					{t('backup.latest')}
				</Caption13Up>
				<Text02S style={styles.text}>
					{max &&
						t('backup.full', {
							time: t('intl:dateTime', {
								v: new Date(max),
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
						})}
					{!max && t('backup.not_yet')}
				</Text02S>
			</ThemedView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	caption: {
		marginBottom: 12,
	},
	status: {
		flex: 1,
		paddingHorizontal: 16,
	},
	text: {
		fontSize: 15,
	},
});

export default memo(BackupSettings);
