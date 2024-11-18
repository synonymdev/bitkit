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
import Dialog from '../../components/Dialog';
import NavigationHeader from '../../components/NavigationHeader';
import KeyboardAvoidingView from '../../components/KeyboardAvoidingView';
import Button from '../../components/buttons/Button';
import SafeAreaInset from '../../components/SafeAreaInset';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import Divider from '../../components/Divider';
import { Keyboard } from '../../hooks/keyboard';
import { useProfile, useSlashtags } from '../../hooks/slashtags';
import {
	setLinks,
	setOnboardingProfileStep,
} from '../../store/slices/slashtags';
import { showBottomSheet } from '../../store/utils/ui';
import { BasicProfile } from '../../store/types/slashtags';
import { slashtagsLinksSelector } from '../../store/reselect/slashtags';
import { onboardingProfileStepSelector } from '../../store/reselect/slashtags';
import { arraysMatch } from '../../utils/helpers';
import { deleteProfile, saveProfile } from '../../utils/slashtags';
import { showToast } from '../../utils/notifications';
import ProfileLinkNavigation from '../../navigation/bottom-sheet/ProfileLinkNavigation';
import type { RootStackScreenProps } from '../../navigation/types';

const ProfileEdit = ({
	navigation,
}: RootStackScreenProps<'Profile' | 'ProfileEdit'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { url, profile: slashtagsProfile } = useSlashtags();
	const { profile: savedProfile } = useProfile(url);
	const [hasEdited, setHasEdited] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
		setIsLoading(true);
		const res = await saveProfile(url, profile, slashtagsProfile);
		setIsLoading(false);
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

	const onDelete = async (): Promise<void> => {
		setIsLoading(true);
		const res = await deleteProfile(url, slashtagsProfile);
		setIsLoading(false);
		setShowDeleteDialog(false);
		if (res.isErr()) {
			return;
		}
		await Keyboard.dismiss();
		navigation.popToTop();
		showToast({
			type: 'success',
			title: t('profile_delete_success_title'),
			description: t('profile_delete_success_msg'),
		});
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
					<View
						style={[
							styles.buttonsContainer,
							onboardedProfile && styles.bottom,
						]}>
						{onboardedProfile && (
							<Button
								style={styles.button}
								text={t('profile_delete')}
								size="large"
								variant="secondary"
								loading={isLoading}
								onPress={() => setShowDeleteDialog(true)}
								testID="ProfileDeleteButton"
							/>
						)}

						<Button
							style={styles.button}
							text={t(onboardedProfile ? 'profile_save' : 'continue')}
							size="large"
							loading={isLoading}
							disabled={!hasEdited || !isValid()}
							onPress={onSave}
							testID="ProfileSaveButton"
						/>
					</View>
				</ScrollView>
				<SafeAreaInset type="bottom" minPadding={16} />
			</KeyboardAvoidingView>

			<ProfileLinkNavigation />

			<Dialog
				visible={showDeleteDialog}
				title={t('profile_delete_dialogue_title')}
				description={t('profile_delete_dialogue_msg')}
				confirmText={t('profile_delete_dialogue_yes')}
				visibleTestID="DeleteDialog"
				onHide={(): void => setShowDeleteDialog(false)}
				onConfirm={onDelete}
				onCancel={(): void => setShowDeleteDialog(false)}
			/>
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
	buttonsContainer: {
		flexDirection: 'row',
		marginTop: 16,
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(ProfileEdit);
