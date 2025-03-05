import {
	DrawerContentComponentProps,
	DrawerContentScrollView,
} from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import AppStatus from '../../components/AppStatus';
import GradientView from '../../components/GradientView';
import colors from '../../styles/colors';
import { Pressable } from '../../styles/components';
import {
	CoinsIcon,
	HeartbeatIcon,
	SettingsIcon,
	StackIcon,
	UserSquareIcon,
	UsersIcon,
} from '../../styles/icons';
import { DrawerText } from '../../styles/text';
import { DrawerStackNavigationProp } from './DrawerNavigator';

type DrawerItemProps = {
	icon: ReactElement;
	label: string;
	testID?: string;
	onPress: () => void;
};

const DrawerItem = ({
	icon,
	label,
	testID,
	onPress,
}: DrawerItemProps): ReactElement => (
	<Pressable
		style={styles.drawerItem}
		color="transparent"
		hitSlop={{ horizontal: 16 }}
		testID={testID}
		onPress={onPress}>
		<View style={styles.drawerItemIcon}>{icon}</View>
		<DrawerText style={styles.drawerItemLabel}>{label}</DrawerText>
	</Pressable>
);

const DrawerContent = (props: DrawerContentComponentProps): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<DrawerStackNavigationProp>();

	return (
		<GradientView style={[styles.drawer]}>
			<DrawerContentScrollView
				contentContainerStyle={styles.drawerContent}
				bounces={false}
				{...props}>
				<DrawerItem
					icon={<CoinsIcon color="brand" width={24} height={24} />}
					label={t('drawer.wallet')}
					testID="DrawerWallet"
					onPress={() => navigation.navigate('Wallet')}
				/>
				<DrawerItem
					icon={<HeartbeatIcon color="brand" width={24} height={24} />}
					label={t('drawer.activity')}
					testID="DrawerActivity"
					onPress={() => {
						navigation.navigate('Wallet', { screen: 'ActivityFiltered' });
					}}
				/>
				<DrawerItem
					icon={<UsersIcon color="brand" width={24} height={24} />}
					label={t('drawer.contacts')}
					testID="DrawerContacts"
					onPress={() => navigation.navigate('Contacts')}
				/>
				<DrawerItem
					icon={<UserSquareIcon color="brand" width={24} height={24} />}
					label={t('drawer.profile')}
					testID="DrawerProfile"
					onPress={() => navigation.navigate('Profile')}
				/>
				<DrawerItem
					icon={<StackIcon color="brand" width={24} height={24} />}
					label={t('drawer.widgets')}
					testID="DrawerWidgets"
					onPress={() => navigation.navigate('WidgetsSuggestions')}
				/>
				<DrawerItem
					icon={<SettingsIcon color="brand" width={24} height={24} />}
					label={t('drawer.settings')}
					testID="DrawerSettings"
					onPress={() => {
						navigation.navigate('Settings', { screen: 'MainSettings' });
					}}
				/>

				<AppStatus
					style={styles.appStatus}
					showText={true}
					showReady={true}
					testID="DrawerAppStatus"
					onPress={() => {
						navigation.navigate('Settings', { screen: 'AppStatus' });
					}}
				/>
			</DrawerContentScrollView>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	drawer: {
		flex: 1,
	},
	drawerContent: {
		flex: 1,
	},
	drawerItem: {
		borderBottomWidth: 1,
		borderBottomColor: colors.white10,
		flexDirection: 'row',
		alignItems: 'center',
		height: 56,
	},
	drawerItemIcon: {
		width: 24,
		height: 24,
		marginRight: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	drawerItemLabel: {
		textTransform: 'uppercase',
	},
	appStatus: {
		marginTop: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
});

export default DrawerContent;
