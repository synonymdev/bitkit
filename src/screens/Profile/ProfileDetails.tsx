import React, { memo, ReactElement, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { UsersIcon } from '../../styles/icons';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import Divider from '../../components/Divider';
import type { RootStackScreenProps } from '../../navigation/types';
import Button from '../../components/Button';

const ProfileDetails = ({
	navigation,
}: RootStackScreenProps<'ProfileDetails'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { url } = useSelectedSlashtag();
	const { profile } = useProfile(url);

	const profileLinks = useMemo(() => profile?.links ?? [], [profile?.links]);
	const profileLinksWithIds = useMemo(() => {
		return profileLinks.map((link) => ({
			...link,
			id: `${link.title}:${link.url}`,
		}));
	}, [profileLinks]);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				style={styles.header}
				title={t('profile')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
				onActionPress={(): void => {
					navigation.navigate('Contacts');
				}}
				actionIcon={<UsersIcon height={24} width={24} />}
			/>

			<ScrollView>
				<View style={styles.content}>
					<ProfileCard url={url} profile={profile} resolving={false} />
					<Divider />
					<View style={styles.bottom}>
						<ProfileLinks
							links={profileLinksWithIds}
							style={styles.profileDetails}
						/>
					</View>
				</View>
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('profile_edit')}
						size="large"
						onPress={(): void => {
							navigation.navigate('ProfileEdit');
						}}
					/>
				</View>
				<SafeAreaInsets type="bottom" />
			</ScrollView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingBottom: 16,
	},
	header: {
		paddingBottom: 12,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingTop: 23,
		paddingHorizontal: 16,
	},
	bottom: {
		flex: 1,
		flexDirection: 'column',
	},
	profileDetails: {
		marginTop: 40,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
		marginTop: 16,
	},
});

export default memo(ProfileDetails);
