import React, { memo, ReactElement, useMemo } from 'react';
import { IListData } from '../../../components/List';
import SettingsView from './../SettingsView';
import { toggleView } from '../../../store/actions/user';
import { SettingsScreenProps } from '../../../navigation/types';

const BackupSettings = ({
	navigation,
}: SettingsScreenProps<'BackupSettings'>): ReactElement => {
	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Back up your money',
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
						title: 'Back up your data',
						type: 'button',
						onPress: (): void => navigation.navigate('BackupData'),
						enabled: true,
						hide: false,
					},
					{
						title: 'Reset and restore wallet',
						type: 'button',
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.replace('ResetAndRestore');
								},
							});
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
			title="Back Up Or Restore"
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(BackupSettings);
