import { parse } from '@synonymdev/slashtags-url';
import React, { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, View } from 'react-native';

import ContactsList from '../../components/ContactsList';
import NavigationHeader from '../../components/NavigationHeader';
import ProfileImage from '../../components/ProfileImage';
import SafeAreaInset from '../../components/SafeAreaInset';
import SearchInput from '../../components/SearchInput';
import { useAppSelector } from '../../hooks/redux';
import { useProfile, useSlashtags } from '../../hooks/slashtags';
import { RootStackScreenProps } from '../../navigation/types';
import AddContact from '../../sheets/AddContact';
import { useSheetRef } from '../../sheets/SheetRefsProvider';
import {
	contactsSelector,
	onboardedContactsSelector,
} from '../../store/reselect/slashtags';
import {
	View as ThemedView,
	TouchableHighlight,
} from '../../styles/components';
import { PlusIcon } from '../../styles/icons';
import ContactsOnboarding from './ContactsOnboarding';

const Contacts = (props: RootStackScreenProps<'Contacts'>): ReactElement => {
	const onboarded = useAppSelector(onboardedContactsSelector);
	const contacts = useAppSelector(contactsSelector);
	const showOnboarding = !onboarded && Object.keys(contacts).length === 0;

	return showOnboarding ? (
		<ContactsOnboarding {...props} />
	) : (
		<ContactsScreen {...props} />
	);
};

const ContactsScreen = ({
	navigation,
}: RootStackScreenProps<'Contacts'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const sheetRef = useSheetRef('addContact');
	const [searchFilter, setSearchFilter] = useState('');
	const { url: myProfileURL } = useSlashtags();
	const { profile } = useProfile(myProfileURL);

	const handleChangeText = (text: string): void => {
		const txt = text.trim();
		setSearchFilter(txt);
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('contacts')}
				actionIcon={
					<ProfileImage size={28} url={myProfileURL} image={profile?.image} />
				}
				onActionPress={(): void => navigation.navigate('Profile')}
			/>
			<View style={styles.content}>
				<View style={styles.searchRow}>
					<SearchInput
						style={styles.searchInput}
						value={searchFilter}
						onChangeText={handleChangeText}
						testID="ContactsSearchInput"
					/>
					<TouchableHighlight
						style={styles.addButton}
						color="white16"
						testID="AddContact"
						onPress={(): void => {
							Keyboard.dismiss();
							sheetRef.current?.present();
						}}>
						<PlusIcon width={24} height={24} color="brand" />
					</TouchableHighlight>
				</View>
				<View style={styles.contacts}>
					<ContactsList
						searchFilter={searchFilter}
						includeMyProfile={true}
						onPress={({ url }): void => {
							const isContact = parse(url).id !== parse(myProfileURL).id;
							if (isContact) {
								navigation.navigate('Contact', { url });
							} else {
								navigation.navigate('Profile');
							}
						}}
					/>
				</View>
			</View>

			<AddContact navigation={navigation} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingTop: 4,
		paddingHorizontal: 16,
	},
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 32,
	},
	searchInput: {
		flex: 1,
	},
	addButton: {
		alignItems: 'center',
		justifyContent: 'center',
		height: 48,
		width: 48,
		marginLeft: 8,
		borderRadius: 999,
	},
	contacts: {
		flex: 1,
	},
});

export default Contacts;
