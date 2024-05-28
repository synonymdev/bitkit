import React, { useState, useMemo, useEffect, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { parse } from '@synonymdev/slashtags-url';

import { BodyS } from '../../styles/text';
import { View as ThemedView } from '../../styles/components';
import Button from '../../components/Button';
import Divider from '../../components/Divider';
import SafeAreaInset from '../../components/SafeAreaInset';
import HourglassSpinner from '../../components/HourglassSpinner';
import NavigationHeader from '../../components/NavigationHeader';
import KeyboardAvoidingView from '../../components/KeyboardAvoidingView';
import ProfileCard, { MAX_NAME_LENGTH } from '../../components/ProfileCard';
import { RootStackScreenProps } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useProfile, useSlashtags } from '../../hooks/slashtags';
import { addContact } from '../../store/slices/slashtags';
import { contactSelector } from '../../store/reselect/slashtags';

const ContactEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'ContactEdit'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();
	const url = route.params.url;
	const savedContact = useAppSelector((state) => {
		return contactSelector(state, url);
	});
	const contact = useProfile(url);
	const { url: myProfileUrl } = useSlashtags();
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

	const myProfile = useMemo(() => {
		try {
			return parse(myProfileUrl).id === parse(url).id;
		} catch (e) {
			return false;
		}
	}, [myProfileUrl, url]);

	const resolving = !savedContact && contact.resolving;

	const onDiscard = (): void => {
		navigation.navigate('Contacts');
	};

	const onSave = (): void => {
		if (name === null) {
			return;
		}
		// To avoid phishing attacks, a name should always be saved in contact record
		dispatch(addContact({ url: contact.url, name }));
		navigation.navigate('Contact', { url: contact.url });
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
					url={contact.url}
					resolving={resolving}
					profile={profile}
					editable={true}
					contact={true}
					autoFocus={!!savedContact}
					onChange={(_, value): void => setName(value)}
				/>

				{resolving ? <HourglassSpinner /> : <Divider />}

				{myProfile && (
					<View style={styles.error} testID="ContactError">
						<BodyS color="brand">{t('contact_error_yourself')}</BodyS>
					</View>
				)}

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('discard')}
						size="large"
						variant="secondary"
						onPress={onDiscard}
					/>
					<Button
						style={styles.button}
						text={t('save')}
						size="large"
						disabled={myProfile || !name}
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
		gap: 16,
	},
	button: {
		flex: 1,
	},
	error: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
});

export default ContactEdit;
