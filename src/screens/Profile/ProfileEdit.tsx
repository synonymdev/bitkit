import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import c from 'compact-encoding';

import {
	PlusIcon,
	ScrollView,
	View as ThemedView,
	Text02S,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import { toggleView } from '../../store/actions/user';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import { setOnboardingProfileStep } from '../../store/actions/slashtags';
import Store from '../../store/types';
import { BasicProfile } from '../../store/types/slashtags';
import ProfileLinkNavigation from '../../navigation/bottom-sheet/ProfileLinkNavigation';

export const ProfileEdit = ({ navigation }): JSX.Element => {
	const [fields, setFields] = useState<Omit<BasicProfile, 'links'>>({});
	const [links, setLinks] = useState<object>({});

	const { url, slashtag } = useSelectedSlashtag();
	const { profile: savedProfile } = useProfile(url);

	const saveProfile = useCallback(
		(profile: BasicProfile) => {
			const publicDrive = slashtag?.drivestore.get();
			return publicDrive.put('/profile.json', c.encode(c.json, profile));
		},
		[slashtag],
	);

	const onboardedProfile =
		useSelector((state: Store) => state.slashtags.onboardingProfileStep) ===
		'Done';

	useEffect(() => {
		const savedLinks = savedProfile?.links || [];
		const entries = savedLinks?.map((l) => [l.title, l]);
		setLinks(Object.fromEntries(entries));
	}, [savedProfile]);

	const setField = (key: string, value: string | undefined): void => {
		setFields({ ...fields, [key]: value });
	};

	const setLink = (title: string, _url: string | undefined): void => {
		setLinks({ ...links, [title]: { title, url: _url } });
	};

	const profile: BasicProfile = useMemo(() => {
		return {
			...savedProfile,
			...fields,
			links: Object.values(links),
		};
	}, [savedProfile, fields, links]);

	const save = (): void => {
		saveProfile(profile);
		if (!onboardedProfile) {
			setOnboardingProfileStep('PaymentsFromContacts');
		} else {
			navigation.navigate('Profile');
		}
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={onboardedProfile ? 'Edit Profile' : 'Create Profile'}
				onClosePress={(): void => {
					navigation.navigate(onboardedProfile ? 'Profile' : 'Tabs');
				}}
			/>
			<View style={styles.content}>
				<ScrollView>
					<ProfileCard
						url={url}
						editable={true}
						resolving={false}
						profile={profile}
						onChange={setField}
					/>
					<View style={styles.divider} />
					<ProfileLinks links={profile?.links} setLink={setLink} />
					<Button
						text="Add Link"
						style={styles.addLinkButton}
						onPress={(): void => {
							toggleView({
								view: 'profileAddLink',
								data: { isOpen: true },
							});
						}}
						icon={
							<PlusIcon color="brand" width={16} style={styles.addLinkButton} />
						}
					/>
					<View style={styles.divider} />
					<Text02S color="gray1">
						Please note that all your profile information will be publicly
						available and visible.
					</Text02S>
				</ScrollView>
				<Button
					style={styles.saveButton}
					text={onboardedProfile ? 'Save Profile' : 'Next'}
					size="large"
					disabled={
						!profile.name || profile.name.replace(/\s/g, '').length === 0
					}
					onPress={save}
				/>
			</View>

			<ProfileLinkNavigation />
			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	addLinkButton: {
		alignSelf: 'flex-start',
	},
	divider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginTop: 16,
		marginBottom: 16,
	},
	saveButton: {
		marginTop: 'auto',
	},
});

export default ProfileEdit;
