import React, { ReactElement, useMemo } from 'react';
import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Caption13Up, Text01M, View as ThemedView } from '../styles/components';
import ProfileImage from './ProfileImage';
import { SlashtagURL } from './SlashtagURL';
import { useRemote, useSelectedSlashtag } from '../hooks/slashtags';
import { useSlashtagsContacts } from './SlashtagContactsProvider';
import { IContactRecord } from '../store/types/slashtags';

const Divider = (): ReactElement => (
	<ThemedView color="white1" style={dstyles.divider} />
);

const ContactItem = ({
	contact,
	onPress,
}: {
	contact: IContactRecord;
	onPress: Function;
}): JSX.Element => {
	const { remote } = useRemote(contact.url);
	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={(): void => {
				onPress(contact);
			}}>
			<ThemedView style={cstyles.container}>
				<ProfileImage
					url={contact.url}
					image={remote?.profile?.image}
					size={48}
				/>
				<View style={cstyles.column}>
					<Text01M style={cstyles.name}>{contact.name}</Text01M>
					<SlashtagURL color="gray" url={contact.url} />
				</View>
			</ThemedView>
		</TouchableOpacity>
	);
};

const Empty = (): ReactElement => (
	<View style={estyles.empty}>
		<Text01M>No Contacts found</Text01M>
	</View>
);

const ContactsList = ({
	onPress,
	searchFilter = '',
	includeMyProfile = false,
}: {
	onPress: (contact: IContactRecord) => void;
	searchFilter?: string;
	includeMyProfile?: boolean;
}): ReactElement => {
	const { contacts } = useSlashtagsContacts();
	const { url: myProfileURL, profile } = useSelectedSlashtag();

	const filteredContacts = useMemo(() => {
		return Object.values(contacts)
			.sort((a, b) => (a.name > b.name ? 1 : -1))
			.filter(
				({ name }) =>
					searchFilter.length === 0 ||
					name?.toLowerCase().includes(searchFilter?.toLowerCase()),
			);
	}, [contacts, searchFilter]);

	const sectionedContacts = useMemo(() => {
		const sections: { [char: string]: IContactRecord[] } = {};

		filteredContacts.forEach((contact) => {
			const char = contact.name?.slice(0, 1) || 'undefined';
			sections[char]
				? sections[char].push(contact)
				: (sections[char] = [contact]);
		});

		const result = Object.entries(sections).map(([title, data]) => ({
			title,
			data,
		}));

		if (includeMyProfile && searchFilter.length === 0) {
			result.unshift({
				title: 'My profile',
				data: [{ ...profile, url: myProfileURL as string } as IContactRecord],
			});
		}

		return result;
	}, [profile, filteredContacts, myProfileURL, includeMyProfile, searchFilter]);

	return (
		<SectionList
			sections={sectionedContacts as any}
			keyExtractor={(item: IContactRecord): string => item.url}
			ItemSeparatorComponent={Divider}
			SectionSeparatorComponent={Divider}
			ListEmptyComponent={Empty}
			renderSectionHeader={({ section: { title } }): ReactElement => (
				<View style={styles.sectionHeader}>
					<Caption13Up color="gray1">{title}</Caption13Up>
				</View>
			)}
			renderItem={({ item: contact }): ReactElement => (
				<ContactItem contact={contact} onPress={onPress} />
			)}
		/>
	);
};

const dstyles = {
	divider: {
		height: 1,
		marginTop: 16,
		marginBottom: 16,
	},
};

const cstyles = {
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
		marginBottom: 10,
		backgroundColor: 'transparent',
	},
	column: {
		marginLeft: 16,
	},
	name: {
		marginBottom: 4,
	},
};

const estyles = StyleSheet.create({
	empty: {
		alignSelf: 'center',
		marginTop: '50%',
	},
});

const styles = StyleSheet.create({
	sectionHeader: {
		height: 24,
	},
});

export default ContactsList;
