import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Title } from '../../styles/text';
import { Pressable } from '../../styles/components';
import { ProfileIcon, SettingsIcon } from '../../styles/icons';
import ProfileImage from '../../components/ProfileImage';
import { truncate } from '../../utils/helpers';
import { useProfile, useSlashtags } from '../../hooks/slashtags';
import { RootNavigationProp } from '../../navigation/types';
import VerticalShadow from '../../components/VerticalShadow';

const EnabledSlashtagsProfileButton = (): ReactElement => {
	const { t } = useTranslation('slashtags');
	const navigation = useNavigation<RootNavigationProp>();
	const { url } = useSlashtags();
	const { profile } = useProfile(url);

	const openProfile = useCallback(() => {
		navigation.navigate('Profile');
	}, [navigation]);

	return (
		<Pressable
			style={[styles.leftColumn, styles.pressed]}
			color="transparent"
			onPressIn={openProfile}
			hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
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
		</Pressable>
	);
};

const Header = (): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();

	const openContacts = useCallback(() => {
		navigation.navigate('Contacts');
	}, [navigation]);
	const openSettings = useCallback(
		() => navigation.navigate('Settings'),
		[navigation],
	);

	return (
		<View style={styles.container}>
			<View style={styles.shadowContainer}>
				<VerticalShadow />
			</View>
			<EnabledSlashtagsProfileButton />
			<View style={styles.middleColumn} />
			<View style={styles.rightColumn}>
				<Pressable
					style={[styles.profileIcon, styles.pressed]}
					color="transparent"
					hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
					onPressIn={openContacts}
					testID="HeaderContactsButton">
					<ProfileIcon width={24} height={24} />
				</Pressable>
				<Pressable
					style={[styles.cogIcon, styles.pressed]}
					color="transparent"
					hitSlop={{ top: 15, bottom: 15, left: 5, right: 5 }}
					onPressIn={openSettings}
					testID="Settings">
					<SettingsIcon width={24} height={24} />
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
	pressed: {
		opacity: 1,
	},
});

export default memo(Header, () => true);
