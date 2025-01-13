import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

import { EItemType, IListData, ItemData } from '../../components/List';
import SafeAreaInset from '../../components/SafeAreaInset';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { SettingsScreenProps } from '../../navigation/types';
import { enableDevOptionsSelector } from '../../store/reselect/settings';
import { updateSettings } from '../../store/slices/settings';
import { View as ThemedView } from '../../styles/components';
import {
	AboutIcon,
	AdvancedIcon,
	BackupIcon,
	DevSettingsIcon,
	GeneralSettingsIcon,
	SecurityIcon,
	SupportIcon,
} from '../../styles/icons';
import { showToast } from '../../utils/notifications';
import SettingsView from './SettingsView';

const imageSrc = require('./../../assets/illustrations/cog.png');

const MainSettings = ({
	navigation,
}: SettingsScreenProps<'MainSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const enableDevOptions = useAppSelector(enableDevOptionsSelector);
	const [enableDevOptionsCount, setEnableDevOptionsCount] = useState(0);

	const updateDevOptions = (): void => {
		const count = enableDevOptionsCount + 1;
		setEnableDevOptionsCount(count);
		if (count >= 5) {
			const enabled = !enableDevOptions;
			dispatch(updateSettings({ enableDevOptions: enabled }));
			showToast({
				type: 'success',
				title: t(enabled ? 'dev_enabled_title' : 'dev_disabled_title'),
				description: t(
					enabled ? 'dev_enabled_message' : 'dev_disabled_message',
				),
			});
			setEnableDevOptionsCount(0);
		}
	};

	const listData: IListData[] = useMemo(() => {
		const data: ItemData[] = [
			{
				title: t('general_title'),
				type: EItemType.button,
				Icon: GeneralSettingsIcon,
				testID: 'GeneralSettings',
				onPress: (): void => navigation.navigate('GeneralSettings'),
			},
			{
				title: t('security_title'),
				type: EItemType.button,
				Icon: SecurityIcon,
				testID: 'SecuritySettings',
				onPress: (): void => navigation.navigate('SecuritySettings'),
			},
			{
				title: t('backup_title'),
				type: EItemType.button,
				Icon: BackupIcon,
				testID: 'BackupSettings',
				onPress: (): void => navigation.navigate('BackupSettings'),
			},
			{
				title: t('advanced_title'),
				type: EItemType.button,
				Icon: AdvancedIcon,
				testID: 'AdvancedSettings',
				onPress: (): void => navigation.navigate('AdvancedSettings'),
			},
			{
				title: t('support_title'),
				type: EItemType.button,
				Icon: SupportIcon,
				testID: 'Support',
				onPress: (): void => navigation.navigate('SupportSettings'),
			},
			{
				title: t('about_title'),
				type: EItemType.button,
				Icon: AboutIcon,
				testID: 'About',
				onPress: (): void => navigation.navigate('AboutSettings'),
			},
			{
				title: t('dev_title'),
				type: EItemType.button,
				hide: !enableDevOptions,
				Icon: DevSettingsIcon,
				testID: 'DevSettings',
				onPress: (): void => navigation.navigate('DevSettings'),
			},
		];

		return [{ data }];
	}, [enableDevOptions, navigation, t]);

	return (
		<ThemedView style={styles.root}>
			<SettingsView
				title={t('settings')}
				listData={listData}
				fullHeight={false}
			/>
			<TouchableOpacity
				style={styles.imageContainer}
				activeOpacity={1}
				testID="DevOptions"
				onPress={updateDevOptions}>
				<Image style={styles.image} source={imageSrc} />
			</TouchableOpacity>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
		marginBottom: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
});

export default memo(MainSettings);
