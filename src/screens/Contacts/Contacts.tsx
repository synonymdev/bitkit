import React, { useState } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';

import {
	View as ThemedView,
	PlusIcon,
	TouchableOpacity as ThemedTouchableOpacity,
} from '../../styles/components';
import ContactsOnboarding from './ContactsOnboarding';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import SearchInput from '../../components/SearchInput';
import ContactsList from '../../components/ContactsList';
import { toggleView } from '../../store/actions/user';
import Store from '../../store/types';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { RootStackScreenProps } from '../../navigation/types';
import AddContact from './AddContact';

export const Contacts = (
	props: RootStackScreenProps<'Contacts'>,
): JSX.Element => {
	const onboardedContacts = useSelector(
		(state: Store) => state.slashtags.onboardedContacts,
	);

	return onboardedContacts ? (
		<ContactsScreen {...props} />
	) : (
		<ContactsOnboarding {...props} />
	);
};

const ContactsScreen = ({
	navigation,
}: RootStackScreenProps<'Contacts'>): JSX.Element => {
	const [searchFilter, setSearchFilter] = useState('');
	const { url: myProfileURL } = useSelectedSlashtag();

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Contacts"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.content}>
				<View style={styles.searchRow}>
					<SearchInput
						style={styles.searchInput}
						value={searchFilter}
						onChangeText={setSearchFilter}
					/>
					<ThemedTouchableOpacity
						style={styles.addButton}
						color="white08"
						activeOpacity={0.8}
						onPress={(): void => {
							Keyboard.dismiss();
							toggleView({
								view: 'addContactModal',
								data: { isOpen: true },
							});
						}}>
						<PlusIcon width={24} height={24} color="brand" />
					</ThemedTouchableOpacity>
				</View>
				<View style={styles.contacts}>
					<ContactsList
						searchFilter={searchFilter}
						includeMyProfile={true}
						onPress={({ url }): void => {
							const isContact = url !== myProfileURL;
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
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		margin: 20,
		marginTop: 0,
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
