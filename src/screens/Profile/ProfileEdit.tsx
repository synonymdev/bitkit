import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import c from 'compact-encoding';

import {
	PlusIcon,
	ScrollView,
	Subtitle,
	View,
	Text02S,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import LabeledInput from '../../components/LabeledInput';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { toggleView } from '../../store/actions/user';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import { setOnboardingProfileStep } from '../../store/actions/slashtags';
import Store from '../../store/types';
import { BasicProfile } from '../../store/types/slashtags';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';

export const ProfileEdit = ({ navigation }): JSX.Element => {
	const [fields, setFields] = useState<Omit<BasicProfile, 'links'>>({});
	const [addLinkForm, setAddLinkForm] = useState({ label: '', url: '' });
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

	useBottomSheetBackPress('profileAddLinkForm');

	useEffect(() => {
		const savedLinks = savedProfile?.links || [];
		const entries = savedLinks?.map((l) => [l.title, l]);
		setLinks(Object.fromEntries(entries));
	}, [savedProfile]);

	const setField = (key: string, value: string | undefined): void =>
		setFields({ ...fields, [key]: value });

	const setLink = (title: string, _url: string | undefined): void =>
		setLinks({ ...links, [title]: { title, url: _url } });

	const profile: BasicProfile = useMemo(() => {
		const merged = {
			...savedProfile,
			...fields,
			links: Object.values(links),
		};
		return merged;
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
		<View style={styles.container}>
			<SafeAreaInsets type={'top'} />
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
					<View style={styles.topRow} />
					<ProfileLinks links={profile?.links} setLink={setLink} />
					<Button
						text="Add Link"
						style={styles.addLinkButton}
						onPress={(): void => {
							toggleView({
								view: 'profileAddLinkForm',
								data: { isOpen: true },
							});
						}}
						icon={
							<PlusIcon color="brand" width={16} style={styles.addLinkButton} />
						}
					/>
					<View style={styles.divider} />
					<Text02S color="gray1" style={styles.note}>
						Please note that all your profile information will be publicly
						available.
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

			<BottomSheetWrapper
				backdrop={true}
				view="profileAddLinkForm"
				snapPoints={[400]}>
				<View style={styles.editDataModal}>
					<Subtitle style={styles.addLinkTitle}>Add link</Subtitle>
					<View style={styles.editLinkContent}>
						<LabeledInput
							bottomSheet={true}
							label="Label"
							value={addLinkForm.label}
							placeholder="For example 'Website'"
							onChange={(label: string): void => {
								setAddLinkForm({ ...addLinkForm, label });
							}}
						/>
						<LabeledInput
							bottomSheet={true}
							label="Link OR TEXT"
							value={addLinkForm.url}
							placeholder="https://"
							onChange={(_url: string): void => {
								setAddLinkForm({ ...addLinkForm, url: _url });
							}}
						/>
						<Button
							text="Save"
							size="large"
							style={styles.addLinkSave}
							disabled={
								!(addLinkForm.label?.length > 0 && addLinkForm.url?.length > 0)
							}
							onPress={(): void => {
								const { label, url: _url } = addLinkForm;
								if (label?.length > 0) {
									setLink(label, _url);
									setAddLinkForm({ label: '', url: '' });
								}
								toggleView({
									view: 'profileAddLinkForm',
									data: { isOpen: false },
								});
							}}
						/>
					</View>
				</View>
			</BottomSheetWrapper>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		margin: 20,
		marginTop: 0,
	},
	topRow: {
		display: 'flex',
		flexDirection: 'row',
		marginBottom: 32,
	},
	note: {
		marginRight: 16,
		flex: 1,
		paddingRight: 20,
	},
	addLinkButton: {
		alignSelf: 'flex-start',
	},
	editDataModal: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	addLinkTitle: {
		textAlign: 'center',
		marginBottom: 16,
	},
	editLinkContent: {
		display: 'flex',
		padding: 16,
		backgroundColor: 'transparent',
	},
	addLinkSave: {
		marginTop: 8,
	},
	saveButton: {
		marginTop: 32,
	},
	divider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginTop: 16,
		marginBottom: 16,
	},
});

export default ProfileEdit;
