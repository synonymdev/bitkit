import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { __DISABLE_SLASHTAGS__ } from '../../constants/env';
import { Title } from '../../styles/text';
import { ProfileIcon, SettingsIcon } from '../../styles/icons';
import ProfileImage from '../../components/ProfileImage';
import { truncate } from '../../utils/helpers';
import { useProfile2, useSelectedSlashtag2 } from '../../hooks/slashtags2';
import { RootNavigationProp } from '../../navigation/types';
import VerticalShadow from '../../components/VerticalShadow';

const EnabledSlashtagsProfileButton = (): ReactElement => {
	const { t } = useTranslation('slashtags');
	const navigation = useNavigation<RootNavigationProp>();
	const { url } = useSelectedSlashtag2();
	const { profile } = useProfile2(url);

	const openProfile = useCallback(() => {
		navigation.navigate('Profile');
	}, [navigation]);

	return (
		<TouchableOpacity
			style={styles.leftColumn}
			activeOpacity={1}
			onPress={openProfile}
			testID="Header">
			<ProfileImage
				size={32}
				url={url}
				image={profile.image}
				style={styles.profileImage}
			/>
			{profile.name ? (
				<Title>{truncate(profile?.name, 20)}</Title>
			) : (
				<Title>{t('your_name_capital')}</Title>
			)}
		</TouchableOpacity>
	);
};

const ProfileButton = (): ReactElement => {
	const { t } = useTranslation('slashtags');
	return __DISABLE_SLASHTAGS__ ? (
		<TouchableOpacity
			style={styles.leftColumn}
			activeOpacity={1}
			onPress={(): void => {}}>
			<ProfileImage size={32} url="" image="" style={styles.profileImage} />
			<Title color="gray">{t('disabled')}</Title>
		</TouchableOpacity>
	) : (
		<EnabledSlashtagsProfileButton />
	);
};

const Header = (): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();

	const openContacts = useCallback(() => {
		!__DISABLE_SLASHTAGS__ && navigation.navigate('Contacts');
	}, [navigation]);
	const openSettings = useCallback(
		() => navigation.navigate('Settings', { screen: 'MainSettings' }),
		[navigation],
	);

	return (
		<View style={styles.container}>
			<View style={styles.shadowContainer}>
				<VerticalShadow />
			</View>
			<ProfileButton />
			<View style={styles.middleColumn} />
			<View style={styles.rightColumn}>
				<TouchableOpacity
					style={styles.profileIcon}
					activeOpacity={1}
					onPress={openContacts}
					testID="HeaderContactsButton">
					<ProfileIcon width={24} height={24} />
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.cogIcon}
					activeOpacity={1}
					onPress={openSettings}
					testID="Settings">
					<SettingsIcon width={24} height={24} />
				</TouchableOpacity>
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
	cogIcon: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 32,
		paddingLeft: 10,
		paddingRight: 16,
	},
	profileIcon: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 32,
		paddingRight: 10,
	},
	leftColumn: {
		flex: 6,
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 16,
	},
	middleColumn: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
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
});

export default memo(Header, () => true);
