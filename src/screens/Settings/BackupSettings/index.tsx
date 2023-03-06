import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { closeBottomSheet, showBottomSheet } from '../../../store/actions/ui';
import { SettingsScreenProps } from '../../../navigation/types';
import Store from '../../../store/types';

const BackupSettings = ({
	navigation,
}: SettingsScreenProps<'BackupSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const pin = useSelector((state: Store) => state.settings.pin);

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
		<SettingsView
			title={t('backup.title')}
			listData={settingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(BackupSettings);
