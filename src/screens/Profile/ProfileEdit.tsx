import React, {
	useState,
	useMemo,
	useEffect,
	useCallback,
	memo,
	ReactElement,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useTranslation } from 'react-i18next';

import { ScrollView, View as ThemedView } from '../../styles/components';
import { BodyS } from '../../styles/text';
import { PlusIcon } from '../../styles/icons';
import NavigationHeader from '../../components/NavigationHeader';
import KeyboardAvoidingView from '../../components/KeyboardAvoidingView';
import Button from '../../components/Button';
import SafeAreaInset from '../../components/SafeAreaInset';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import Divider from '../../components/Divider';
import { Keyboard } from '../../hooks/keyboard';
import { useProfile2, useSlashtags2 } from '../../hooks/slashtags2';
import {
	setLinks,
	setOnboardingProfileStep,
} from '../../store/slices/slashtags';
import { showBottomSheet } from '../../store/utils/ui';
import { BasicProfile } from '../../store/types/slashtags';
import { slashtagsLinksSelector } from '../../store/reselect/slashtags';
import { onboardingProfileStepSelector } from '../../store/reselect/slashtags';
import { arraysMatch } from '../../utils/helpers';
import ProfileLinkNavigation from '../../navigation/bottom-sheet/ProfileLinkNavigation';
import type { RootStackScreenProps } from '../../navigation/types';
import { saveProfile2 } from '../../utils/slashtags2';

const ProfileEdit = ({
	navigation,
}: RootStackScreenProps<'Profile' | 'ProfileEdit'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { url, profile: slashtagsProfile } = useSlashtags2();
	const { profile: savedProfile } = useProfile2(url);
	const [hasEdited, setHasEdited] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [fields, setFields] = useState<Omit<BasicProfile, 'links'>>({});
	const dispatch = useAppDispatch();
	const links = useAppSelector(slashtagsLinksSelector);
	const onboardingStep = useAppSelector(onboardingProfileStepSelector);

	const onboardedProfile = onboardingStep === 'Done';

	useEffect(() => {
		const savedLinks = savedProfile?.links || [];
		// add id field before saving to redux
		const localLinks = savedLinks.map((link) => ({
			...link,
			id: `${link.title}:${link.url}`,
		}));
		if (localLinks.length > 0) {
			dispatch(setLinks(localLinks));
		}
	}, [savedProfile?.links, dispatch]);

	// show save button if links have changed
	useEffect(() => {
		const savedLinks = savedProfile?.links || [];
		if (arraysMatch(links, savedLinks)) {
			setHasEdited(false);
		} else {
			setHasEdited(true);
		}
	}, [links, savedProfile?.links]);

	const setField = useCallback(
		(key: string, value: string): void => {
			setHasEdited(true);
			setFields({ ...fields, [key]: value });
		},
		[fields],
	);

	const profile: BasicProfile = useMemo(() => {
		return {
			...savedProfile,
			...fields,
			// remove id field before saving to remote
			links: links.map(({ id: _id, ...rest }) => rest),
		};
	}, [savedProfile, fields, links]);

	const onAddLink = async (): Promise<void> => {
		await Keyboard.dismiss();
		showBottomSheet('profileAddDataForm');
	};

	const onSave = async (): Promise<void> => {
		setIsSaving(true);
		const res = await saveProfile2(url, profile, slashtagsProfile);
		setIsSaving(false);
		if (res.isErr()) {
			return;
		}
		await Keyboard.dismiss();

		if (!onboardedProfile) {
			dispatch(setOnboardingProfileStep('OfflinePayments'));
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
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t(onboardedProfile ? 'profile_edit' : 'profile_create')}
				onClosePress={(): void => {
					navigation.navigate(onboardedProfile ? 'Profile' : 'Wallet');
				}}
			/>
			<KeyboardAvoidingView style={styles.content}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}>
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
						style={styles.addLinkButton}
						text={t('profile_add_link')}
						color="white10"
						icon={
							<PlusIcon color="brand" width={16} style={styles.addLinkButton} />
						}
						testID="ProfileAddLink"
						onPress={onAddLink}
					/>
					<Divider />
					<BodyS color="secondary">{t('profile_public_warn')}</BodyS>

					{/* leave button visible over keyboard for onboarding */}
					<View style={onboardedProfile && styles.bottom}>
						<Button
							style={styles.button}
							text={t(onboardedProfile ? 'profile_save' : 'continue')}
							size="large"
							loading={isSaving}
							disabled={!hasEdited || !isValid()}
							onPress={onSave}
							testID="ProfileSaveButton"
						/>
					</View>
				</ScrollView>
				<SafeAreaInset type="bottom" minPadding={16} />
			</KeyboardAvoidingView>

			<ProfileLinkNavigation />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	scrollContent: {
		flexGrow: 1,
	},
	addLinkButton: {
		alignSelf: 'flex-start',
	},
	bottom: {
		marginTop: 'auto',
	},
	button: {
		flex: 1,
		marginTop: 16,
	},
});

export default memo(ProfileEdit);
