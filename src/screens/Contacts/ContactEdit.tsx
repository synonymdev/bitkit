import React, { useState, useMemo, useEffect, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import KeyboardAvoidingView from '../../components/KeyboardAvoidingView';
import ProfileCard, { MAX_NAME_LENGTH } from '../../components/ProfileCard';
import Button from '../../components/Button';
import { useProfile2 } from '../../hooks/slashtags2';
import { RootStackScreenProps } from '../../navigation/types';
import Divider from '../../components/Divider';
import HourglassSpinner from '../../components/HourglassSpinner';
import { contactSelector } from '../../store/reselect/slashtags';
import { addContact } from '../../store/actions/slashtags';
import { useAppSelector } from '../../hooks/redux';

const ContactEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'ContactEdit'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const url = route.params.url;
	const savedContact = useAppSelector((state) => {
		return contactSelector(state, url);
	});
	const contact = useProfile2(url, { resolve: true });
	const [name, setName] = useState<string | null>(savedContact?.name || null);

	const profile = useMemo(
		() => ({
			...contact.profile,
			// Keep name length in contact record managable in case user doesn't override the remote name
			name:
				name !== null ? name : contact.profile.name?.slice(0, MAX_NAME_LENGTH),
		}),
		[contact.profile, name],
	);

	const resolving = !savedContact && contact.resolving;

	const onDiscard = (): void => {
		navigation.navigate('Contacts');
	};

	const onSave = (): void => {
		if (name === null) {
			return;
		}
		// To avoid phishing attacks, a name should always be saved in contact record
		addContact(url, name);
		navigation.navigate('Contact', { url });
	};

	useEffect(() => {
		if (contact.profile.name && name === null) {
			setName(contact.profile.name);
		}
	}, [contact, name]);

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
					onChange={(_, value): void => setName(value)}
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
						disabled={!name}
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
