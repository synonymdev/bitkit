import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { PlusIcon, View as ThemedView, Text02S } from '../../styles/components';
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
import Divider from '../../components/Divider';
import { removeTodo } from '../../store/actions/todos';

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
		// add id field before saving to redux
		const localLinks = savedLinks.map((link) => ({
			...link,
			id: `${link.title}:${link.url}`,
		}));
		setLinks(localLinks);
	}, [savedProfile?.links]);

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
			// remove id field before saving to remote
			links: links.map(({ id: _id, ...rest }) => rest),
		};
	}, [savedProfile, fields, links]);

	const save = async (): Promise<void> => {
		await saveProfile(slashtag, profile);
		if (!onboardedProfile) {
			setOnboardingProfileStep('OfflinePayments');
			removeTodo('slashtagsProfile');
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
				style={styles.header}
				title={onboardedProfile ? 'Profile' : 'Create Profile'}
				onClosePress={(): void => {
					navigation.navigate(onboardedProfile ? 'Profile' : 'Tabs');
				}}
			/>
			<KeyboardAwareScrollView contentContainerStyle={styles.content}>
				<ProfileCard
					url={url}
					editable={true}
					resolving={false}
					profile={profile}
					onChange={setField}
				/>
				<Divider />
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
				<Divider />
				<Text02S color="gray1">
					Please note that all your profile information will be publicly
					available and visible.
				</Text02S>

				{(!onboardedProfile || hasEdited) && (
					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							text={onboardedProfile ? 'Save Profile' : 'Continue'}
							size="large"
							disabled={!isValid()}
							onPress={save}
						/>
					</View>
				)}
			</KeyboardAwareScrollView>
			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingBottom: 32,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	addLinkButton: {
		alignSelf: 'flex-start',
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

export default ProfileEdit;
