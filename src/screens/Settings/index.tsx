import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, Image, View, TouchableOpacity } from 'react-native';
import { IListData, ItemData } from '../../components/List';
import Glow from './../../components/Glow';
import SettingsView from './SettingsView';
import { useSelector } from 'react-redux';
import Store from '../../store/types';
import { updateSettings } from '../../store/actions/settings';
import { showSuccessNotification } from '../../utils/notifications';

const SettingsMenu = ({ navigation }): ReactElement => {
	const enableDevOptions = useSelector(
		(state: Store) => state.settings.enableDevOptions,
	);
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

	const SettingsListData: IListData[] = useMemo(() => {
		const data: ItemData[] = [
			{
				title: 'General',
				type: 'button',
				onPress: (): void => navigation.navigate('GeneralSettings'),
				hide: false,
			},
			{
				title: 'Security and Privacy',
				type: 'button',
				onPress: (): void => navigation.navigate('SecuritySettings'),
				hide: false,
			},
			{
				title: 'Back up or Restore',
				type: 'button',
				onPress: (): void => navigation.navigate('BackupSettings'),
				hide: false,
			},
			{
				title: 'Networks',
				type: 'button',
				onPress: (): void => navigation.navigate('NetworksSettings'),
				hide: false,
			},
			{
				title: 'Advanced',
				type: 'button',
				onPress: (): void => navigation.navigate('AdvancedSettings'),
				hide: false,
			},
			{
				title: 'About Bitkit',
				type: 'button',
				onPress: (): void => navigation.navigate('AboutSettings'),
				hide: false,
			},
		];

		if (enableDevOptions) {
			data.push({
				title: 'Dev settings',
				type: 'button',
				onPress: (): void => navigation.navigate('DevSettings'),
				hide: false,
			});
		}
		return [{ data }];
	}, [enableDevOptions, navigation]);

	return (
		<View style={styles.container}>
			<SettingsView
				title={'Settings'}
				listData={SettingsListData}
				showBackNavigation={true}
				fullHeight={false}
			/>
			<TouchableOpacity
				onPress={updateDevOptions}
				style={styles.imageContainer}
				activeOpacity={1}>
				<View style={styles.imageContainer} pointerEvents="none">
					<Glow color="brand" size={500} style={styles.glow} />
					<Image
						style={styles.image}
						resizeMode="contain"
						source={require('./../../assets/illustrations/cog.png')}
					/>
				</View>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	imageContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flexGrow: 1,
	},
	image: {
		width: 200,
		height: 200,
	},
	glow: {
		position: 'absolute',
	},
});

export default memo(SettingsMenu);
