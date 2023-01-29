import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { View as ThemedView } from '../../styles/components';
import { EItemType, IListData, ItemData } from '../../components/List';
import SettingsView from './SettingsView';
import GlowImage from '../../components/GlowImage';
import { updateSettings } from '../../store/actions/settings';
import { showSuccessNotification } from '../../utils/notifications';
import { SettingsScreenProps } from '../../navigation/types';
import { enableDevOptionsSelector } from '../../store/reselect/settings';

const imageSrc = require('./../../assets/illustrations/cog.png');

const MainSettings = ({
	navigation,
}: SettingsScreenProps<'MainSettings'>): ReactElement => {
	const enableDevOptions = useSelector(enableDevOptionsSelector);
	const [enableDevOptionsCount, setEnableDevOptionsCount] = useState(0);

	const updateDevOptions = useCallback(() => {
		const count = enableDevOptionsCount + 1;
		setEnableDevOptionsCount(count);
		if (count >= 5) {
			const enabled = !enableDevOptions;
			updateSettings({
				enableDevOptions: enabled,
			});
			const title = enabled ? 'Dev Options Enabled' : 'Dev Options Disabled';
			const message = enabled
				? 'Dev options are now enabled throughout the app.'
				: 'Dev options are now disabled throughout the app.';
			showSuccessNotification({
				title,
				message,
			});
			setEnableDevOptionsCount(0);
		}
	}, [enableDevOptions, enableDevOptionsCount]);

	const settingsListData: IListData[] = useMemo(() => {
		const data: ItemData[] = [
			{
				title: 'General',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('GeneralSettings'),
				testID: 'GeneralSettings',
			},
			{
				title: 'Security and Privacy',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('SecuritySettings'),
				testID: 'SecuritySettings',
			},
			{
				title: 'Back up or Restore',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('BackupSettings'),
				testID: 'BackupSettings',
			},
			{
				title: 'Advanced',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('AdvancedSettings'),
				testID: 'AdvancedSettings',
			},
			{
				title: 'About Bitkit',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('AboutSettings'),
			},
		];

		if (enableDevOptions) {
			data.push({
				title: 'Dev settings',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('DevSettings'),
			});
		}
		return [{ data }];
	}, [enableDevOptions, navigation]);

	return (
		<ThemedView style={styles.container}>
			<SettingsView
				title="Settings"
				listData={settingsListData}
				showBackNavigation={true}
				fullHeight={false}
			/>
			<TouchableOpacity
				style={styles.imageContainer}
				activeOpacity={1}
				onPress={updateDevOptions}
				testID="DevOptions">
				<GlowImage image={imageSrc} imageSize={200} />
			</TouchableOpacity>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	imageContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flexGrow: 1,
	},
});

export default memo(MainSettings);
