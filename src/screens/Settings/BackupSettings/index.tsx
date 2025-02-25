import React, { ReactElement, ReactNode, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EItemType, IListData } from '../../../components/List';
import Button from '../../../components/buttons/Button';
import { __E2E__ } from '../../../constants/env';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { SettingsScreenProps } from '../../../navigation/types';
import { backupSelector } from '../../../store/reselect/backup';
import { lightningBackupSelector } from '../../../store/reselect/lightning';
import { forceBackup } from '../../../store/slices/backup';
import { TBackupItem } from '../../../store/types/backup';
import { EBackupCategory } from '../../../store/utils/backup';
import { toggleBottomSheet } from '../../../store/utils/ui';
import { ScrollView, View as ThemedView } from '../../../styles/components';
import {
	ArrowClockwise,
	LightningHollow,
	NoteIcon,
	RectanglesTwo,
	SettingsIcon,
	TagIcon,
	TimerIconAlt,
	TransferIcon,
	UsersIcon,
} from '../../../styles/icons';
import { BodyMSB, Caption13Up, CaptionB } from '../../../styles/text';
import { IThemeColors } from '../../../styles/themes';
import { i18nTime } from '../../../utils/i18n';
import SettingsView from '../SettingsView';

const Status = ({
	Icon,
	title,
	status,
	category,
	disableRetry,
}: {
	Icon: React.FunctionComponent<any>;
	title: ReactNode;
	status: TBackupItem;
	category?: EBackupCategory;
	disableRetry?: boolean;
}): ReactElement => {
	const { t } = useTranslation('settings');
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });
	const dispatch = useAppDispatch();

	let subtitle: string;
	let iconColor: keyof IThemeColors;
	let iconBackground: keyof IThemeColors;
	let showRetry = false;

	if (status.running) {
		iconColor = 'yellow';
		iconBackground = 'yellow16';
		subtitle = 'Running';
	} else if (status.synced >= status.required) {
		iconColor = 'green';
		iconBackground = 'green16';
		subtitle = t('backup.status_success', {
			time: tTime('dateTime', {
				v: new Date(status.synced),
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
		iconColor = 'red';
		iconBackground = 'red16';
		showRetry = true;
		subtitle = t('backup.status_failed', {
			time: tTime('dateTime', {
				v: new Date(status.synced),
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
	}

	const retry = (): void => {
		if (!category) {
			return;
		}
		dispatch(forceBackup({ category }));
	};

	return (
		<View style={styles.status}>
			<View style={styles.iconContainer}>
				<ThemedView color={iconBackground} style={styles.icon}>
					<Icon width={16} height={16} color={iconColor} />
				</ThemedView>
			</View>
			<View style={styles.desc}>
				<BodyMSB>{title}</BodyMSB>
				<CaptionB color="secondary">{subtitle}</CaptionB>
			</View>
			{!disableRetry && showRetry && (
				<Button
					style={styles.button}
					icon={<ArrowClockwise color="brand" width={16} height={16} />}
					disabled={disableRetry}
					onPress={retry}
				/>
			)}
		</View>
	);
};

type TBackupCategory = {
	Icon: React.FunctionComponent<any>;
	title: string;
	category?: EBackupCategory;
	status: TBackupItem;
	disableRetry?: boolean;
};

const BackupSettings = ({
	navigation,
}: SettingsScreenProps<'BackupSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const pin = useAppSelector((state) => state.settings.pin);
	const backup = useAppSelector(backupSelector);
	const lightningBackup = useAppSelector(lightningBackupSelector);

	// find lightning latest backup item to show
	const lightning = useMemo(() => {
		const channels = Object.entries(lightningBackup).filter(([key]) =>
			key.startsWith('channel_'),
		);
		if (channels.length === 0) {
			return;
		}
		return channels.reduce((acc, [, value]) => {
			return value.lastQueued > acc.lastQueued ? value : acc;
		}, channels[0][1]);
	}, [lightningBackup]);

	const categories: TBackupCategory[] = [
		{
			Icon: NoteIcon,
			title: t('backup.category_connection_receipts'),
			category: EBackupCategory.blocktank,
			status: backup[EBackupCategory.blocktank],
		},
		{
			Icon: TransferIcon,
			title: t('backup.category_transaction_log'),
			category: EBackupCategory.ldkActivity,
			status: backup[EBackupCategory.ldkActivity],
		},
		{
			Icon: TimerIconAlt,
			title: t('backup.category_wallet'),
			category: EBackupCategory.wallet,
			status: backup[EBackupCategory.wallet],
		},
		{
			Icon: SettingsIcon,
			title: t('backup.category_settings'),
			category: EBackupCategory.settings,
			status: backup[EBackupCategory.settings],
		},
		{
			Icon: RectanglesTwo,
			title: t('backup.category_widgets'),
			category: EBackupCategory.widgets,
			status: backup[EBackupCategory.widgets],
		},
		{
			Icon: TagIcon,
			title: t('backup.category_tags'),
			category: EBackupCategory.metadata,
			status: backup[EBackupCategory.metadata],
		},
		// {
		// 	Icon: UserRectangleIcon,
		// 	title: t('backup.category_profile'),
		// 	lastSync: backup.hyperProfileSeedCheckSuccess,
		// 	syncRequired: backup.hyperProfileCheckRequested,
		// },
		{
			Icon: UsersIcon,
			title: t('backup.category_contacts'),
			category: EBackupCategory.slashtags,
			status: backup[EBackupCategory.slashtags],
		},
	];

	if (lightning) {
		categories.unshift({
			Icon: LightningHollow,
			title: t('backup.category_connections'),
			status: {
				running: false,
				synced: lightning.lastPersisted ?? 0,
				required: lightning.lastQueued,
			},
			disableRetry: true,
		});
	}

	const allSynced = categories.every(
		(c) => c.status.synced >= c.status.required,
	);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: t('backup.wallet'),
						type: EItemType.button,
						testID: 'BackupWallet',
						onPress: (): void => {
							toggleBottomSheet('backupNavigation');
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
			/>

			<ScrollView style={styles.statusRoot}>
				{__E2E__ && allSynced && (
					<Caption13Up style={styles.caption} color="green" testID="AllSynced">
						All Synced
					</Caption13Up>
				)}
				<Caption13Up style={styles.caption} color="secondary">
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
		marginTop: 28,
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
		width: 40,
		height: 40,
		marginLeft: 12,
	},
});

export default memo(BackupSettings);
