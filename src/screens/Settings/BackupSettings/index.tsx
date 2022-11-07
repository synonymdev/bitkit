import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { toggleView } from '../../../store/actions/user';
import { SettingsScreenProps } from '../../../navigation/types';
import Store from '../../../store/types';

const BackupSettings = ({
	navigation,
}: SettingsScreenProps<'BackupSettings'>): ReactElement => {
	const pin = useSelector((state: Store) => state.settings.pin);

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
					},
					{
						title: 'Back up your data',
						type: 'button',
						enabled: true,
						onPress: (): void => {
							navigation.navigate('BackupData');
						},
					},
					{
						title: 'Reset and restore wallet',
						type: 'button',
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
					},
				],
			},
		],
		[navigation, pin],
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
