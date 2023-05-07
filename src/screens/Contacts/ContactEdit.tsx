import React, { useState, useMemo, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import KeyboardAvoidingView from '../../components/KeyboardAvoidingView';
import ProfileCard, { MAX_NAME_LENGTH } from '../../components/ProfileCard';
import Button from '../../components/Button';
import { saveContact } from '../../utils/slashtags';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import { BasicProfile } from '../../store/types/slashtags';
import { useSlashtags } from '../../components/SlashtagsProvider';
import { RootStackScreenProps } from '../../navigation/types';
import Divider from '../../components/Divider';
import HourglassSpinner from '../../components/HourglassSpinner';

const ContactEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'ContactEdit'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const url = route.params.url;
	const savedContact = useSlashtags().contacts[url];
	const { slashtag } = useSelectedSlashtag();
	const contact = useProfile(url, { resolve: !savedContact });
	const [form, setForm] = useState<BasicProfile>(savedContact || {});

	const profile = useMemo(
		() => ({
			...contact.profile,
			// Keep name length in contact record managable in case user doesn't override the remote name
			name: contact.profile.name?.slice(0, MAX_NAME_LENGTH),
			...form,
		}),
		[contact.profile, form],
	);

	const resolving = !savedContact && contact.resolving;

	const onDiscard = (): void => {
		navigation.navigate('Contacts');
	};

	const onSave = (): void => {
		// To avoid phishing attacks, a name should always be saved in contact record
		slashtag && saveContact(slashtag, url, { name: profile.name });
		navigation.navigate('Contact', { url });
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t(savedContact ? 'contact_edit_capital' : 'contact_add_capital')}
				onClosePress={(): void => {
					if (savedContact) {
						navigation.navigate('Contact', { url });
					} else {
						navigation.navigate('Contacts');
					}
				}}
			/>
			<KeyboardAvoidingView style={styles.content}>
				<ProfileCard
					url={url}
					resolving={resolving}
					profile={profile}
					editable={true}
					contact={true}
					autoFocus={!!savedContact}
					onChange={(_, value): void =>
						setForm((prev) => ({ ...prev, name: value }))
					}
				/>

				{resolving ? <HourglassSpinner /> : <Divider />}

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('discard')}
						size="large"
						variant="secondary"
						onPress={onDiscard}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						text={t('save')}
						size="large"
						disabled={form.name?.length === 0}
						onPress={onSave}
						testID="SaveContactButton"
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</KeyboardAvoidingView>
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
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default ContactEdit;
