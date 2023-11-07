import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView, ScrollView } from '../../styles/components';
import { UsersIcon } from '../../styles/icons';
import { useProfile2, useSelectedSlashtag2 } from '../../hooks/slashtags2';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import Divider from '../../components/Divider';
import Button from '../../components/Button';
import type { RootStackScreenProps } from '../../navigation/types';

const ProfileDetails = ({
	navigation,
}: RootStackScreenProps<'ProfileDetails'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { url } = useSelectedSlashtag2();
	const { profile } = useProfile2(url);

	const profileLinks = useMemo(() => profile?.links ?? [], [profile?.links]);
	const profileLinksWithIds = useMemo(() => {
		return profileLinks.map((link) => ({
			...link,
			id: `${link.title}:${link.url}`,
		}));
	}, [profileLinks]);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				style={styles.header}
				title={t('profile')}
				actionIcon={<UsersIcon height={24} width={24} />}
				onActionPress={(): void => {
					navigation.navigate('Contacts');
				}}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			<ScrollView contentContainerStyle={styles.content}>
				<ProfileCard url={url} profile={profile} resolving={false} />
				<Divider />
				<ProfileLinks links={profileLinksWithIds} />
				<Button
					text={t('profile_edit')}
					size="large"
					onPress={(): void => {
						navigation.navigate('ProfileEdit');
					}}
				/>
				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingBottom: 12,
	},
	content: {
		flexGrow: 1,
		paddingTop: 23,
		paddingHorizontal: 16,
	},
});

export default memo(ProfileDetails);
