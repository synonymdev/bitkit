import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { IListData } from './../../components/List';
import Glow from './../../components/Glow';
import SettingsView from './SettingsView';

const SettingsMenu = ({ navigation }): ReactElement => {
	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'Categories',
				data: [
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
				],
			},
		],
		[navigation],
	);

	return (
		<View style={styles.container}>
			<SettingsView
				title={'Settings'}
				listData={SettingsListData}
				showBackNavigation={true}
				fullHeight={false}
			/>
			<View style={styles.imageContainer} pointerEvents="none">
				<Glow color="brand" size={500} style={styles.glow} />
				<Image
					style={styles.image}
					resizeMode="contain"
					source={require('./../../assets/illustrations/cog.png')}
				/>
			</View>
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
		width: 150,
		height: 150,
	},
	glow: {
		position: 'absolute',
	},
});

export default memo(SettingsMenu);
