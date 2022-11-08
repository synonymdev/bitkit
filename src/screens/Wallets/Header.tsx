import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
	View,
	SettingsIcon,
	TouchableOpacity,
	Title,
	ProfileIcon,
} from '../../styles/components';
import ProfileImage from '../../components/ProfileImage';
import { truncate } from '../../utils/helpers';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import { RootNavigationProp } from '../../navigation/types';

const Header = (): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();

	const { url } = useSelectedSlashtag();
	// Could be faster if we use the cache from useSlashtags driectly,
	// but if useProfile is blocked, then everything is too, better solve that.
	const { profile } = useProfile(url);

	const openProfile = useCallback(
		() => navigation.navigate('Profile'),
		[navigation],
	);
	const openContacts = useCallback(
		() => navigation.navigate('Contacts'),
		[navigation],
	);
	const openSettings = useCallback(
		() => navigation.navigate('Settings', { screen: 'MainSettings' }),
		[navigation],
	);

	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={styles.leftColumn}
				activeOpacity={1}
				onPress={openProfile}>
				<ProfileImage
					size={32}
					url={url}
					image={profile?.image}
					style={styles.profileImage}
				/>
				{profile?.name ? (
					<Title>{truncate(profile?.name, 20)}</Title>
				) : (
					<Title>Your name</Title>
				)}
			</TouchableOpacity>
			<View style={styles.middleColumn} />
			<View style={styles.rightColumn}>
				<TouchableOpacity
					style={styles.profileIcon}
					activeOpacity={1}
					onPress={openContacts}>
					<ProfileIcon width={24} height={24} />
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.cogIcon}
					activeOpacity={1}
					onPress={openSettings}>
					<SettingsIcon width={24} height={24} />
				</TouchableOpacity>
			</View>
		</View>
	);
};
const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginTop: 15,
		marginBottom: 10,
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
