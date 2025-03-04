import { useNavigation } from '@react-navigation/native';
import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import AppStatus from '../../components/AppStatus';
import ProfileImage from '../../components/ProfileImage';
import VerticalShadow from '../../components/VerticalShadow';
import { useProfile, useSlashtags } from '../../hooks/slashtags';
import { DrawerStackNavigationProp } from '../../navigation/root/DrawerNavigator';
import { Pressable } from '../../styles/components';
import { BurgerIcon } from '../../styles/icons';
import { Title } from '../../styles/text';
import { truncate } from '../../utils/helpers';

const Header = ({ style }: { style?: StyleProp<ViewStyle> }): ReactElement => {
	const navigation = useNavigation<DrawerStackNavigationProp>();
	const { t } = useTranslation('slashtags');
	const { url } = useSlashtags();
	const { profile } = useProfile(url);

	const openProfile = (): void => {
		navigation.navigate('Profile');
	};

	const openAppStatus = (): void => {
		navigation.navigate('Settings', { screen: 'AppStatus' });
	};

	const openDrawer = (): void => {
		navigation.openDrawer();
	};

	return (
		<View style={[styles.container, style]}>
			<View style={styles.shadowContainer}>
				<VerticalShadow />
			</View>
			<Pressable
				style={styles.leftColumn}
				hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
				testID="Header"
				onPressIn={openProfile}>
				<ProfileImage
					style={styles.profileImage}
					url={url}
					size={32}
					image={profile.image}
				/>
				{profile.name ? (
					<Title>{truncate(profile?.name, 18)}</Title>
				) : (
					<Title testID="EmptyProfileHeader">{t('your_name_capital')}</Title>
				)}
			</Pressable>
			<View style={styles.rightColumn}>
				<AppStatus
					style={styles.appStatus}
					hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
					testID="HeaderAppStatus"
					onPress={openAppStatus}
				/>
				<Pressable
					style={styles.menuIcon}
					hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
					testID="HeaderMenu"
					onPressIn={openDrawer}>
					<BurgerIcon width={24} height={24} />
				</Pressable>
			</View>
		</View>
	);
};

export const HEADER_HEIGHT = 46;

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		height: HEADER_HEIGHT,
	},
	shadowContainer: {
		...StyleSheet.absoluteFillObject,
	},
	leftColumn: {
		flex: 6,
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 16,
	},
	rightColumn: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	profileImage: {
		marginRight: 16,
	},
	appStatus: {
		marginRight: 4,
	},
	menuIcon: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingLeft: 10,
		paddingRight: 16,
	},
});

export default memo(Header, () => true);
