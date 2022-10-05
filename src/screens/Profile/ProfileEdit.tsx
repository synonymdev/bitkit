import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

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
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import {
	setLinks,
	setOnboardingProfileStep,
} from '../../store/actions/slashtags';
import Store from '../../store/types';
import { BasicProfile } from '../../store/types/slashtags';
import { saveProfile } from '../../utils/slashtags';
import type { RootStackScreenProps } from '../../navigation/types';
import { arraysMatch } from '../../utils/helpers';

export const ProfileEdit = ({
	navigation,
}: RootStackScreenProps<'Profile' | 'ProfileEdit'>): JSX.Element => {
	const [fields, setFields] = useState<Omit<BasicProfile, 'links'>>({});
	const links = useSelector((state: Store) => state.slashtags.links);
	const [hasEdited, setHasEdited] = useState(false);

	const { url, slashtag } = useSelectedSlashtag();
	const { profile: savedProfile } = useProfile(url);

	const onboardedProfile =
		useSelector((state: Store) => state.slashtags.onboardingProfileStep) ===
		'Done';

	useEffect(() => {
		const savedLinks = savedProfile?.links || [];
		setLinks(savedLinks);
	}, [savedProfile]);

	// show save button if links have changed
	useEffect(() => {
		const savedLinks = savedProfile?.links || [];
		if (arraysMatch(links, savedLinks)) {
			setHasEdited(false);
		} else {
			setHasEdited(true);
		}
	}, [links, savedProfile?.links]);

	const setField = (key: string, value: string): void => {
		setHasEdited(true);
		setFields({ ...fields, [key]: value });
	};

	const profile: BasicProfile = useMemo(() => {
		return {
			...savedProfile,
			...fields,
			links,
		};
	}, [savedProfile, fields, links]);

	const save = async (): Promise<void> => {
		await saveProfile(slashtag, profile);
		if (!onboardedProfile) {
			setOnboardingProfileStep('PaymentsFromContacts');
		} else {
			navigation.navigate('Profile');
		}
	};

	const isValid = useCallback(() => {
		const isAnyLinkEmpty = links.some((link) => link.url === '');

		if (!profile.name || profile.name.replace(/\s/g, '').length === 0) {
			return false;
		}

		if (isAnyLinkEmpty) {
			return false;
		}

		return true;
	}, [profile, links]);

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
					<ProfileLinks links={links} editable={true} />
					<Button
						text="Add Link"
						style={styles.addLinkButton}
						onPress={(): void => {
							navigation.navigate('ProfileAddLink');
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

				{(!onboardedProfile || hasEdited) && (
					<Button
						style={styles.saveButton}
						text={onboardedProfile ? 'Save Profile' : 'Continue'}
						size="large"
						disabled={!isValid()}
						onPress={save}
					/>
				)}
			</View>

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
