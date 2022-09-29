import React, { ReactElement, useMemo } from 'react';
import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Caption13Up, Text01M, View as ThemedView } from '../styles/components';
import ProfileImage from './ProfileImage';
import { SlashtagURL } from './SlashtagURL';
import { useProfile, useSelectedSlashtag } from '../hooks/slashtags';
import { IContactRecord } from '../store/types/slashtags';
import { useSlashtags } from './SlashtagsProvider';

const Divider = (): ReactElement => (
	<ThemedView color="white1" style={dstyles.divider} />
);

const ContactItem = ({
	contact,
	onPress,
}: {
	contact: IContactRecord;
	onPress: (contact: IContactRecord) => void;
}): JSX.Element => {
	const { profile } = useProfile(contact.url);

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={(): void => {
				onPress(contact);
			}}>
			<ThemedView style={cstyles.container}>
				<ProfileImage url={contact.url} image={profile?.image} size={48} />
				<View style={cstyles.column}>
					<Text01M style={cstyles.name}>{profile?.name || ' '}</Text01M>
					<SlashtagURL
						color="gray"
						url={contact.url}
						onPress={(): void => {
							onPress(contact);
						}}
					/>
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
	sectionBackgroundColor = 'black',
}: {
	onPress: (contact: IContactRecord) => void;
	searchFilter?: string;
	includeMyProfile?: boolean;
	sectionBackgroundColor?: string;
}): ReactElement => {
	const contacts = useSlashtags().contacts;
	const { url: myProfileURL } = useSelectedSlashtag();

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
			const char = contact?.name ? contact.name.slice(0, 1) : 'undefined';
			if (char) {
				sections[char]
					? sections[char].push(contact)
					: (sections[char] = [contact]);
			}
		});

		const result = Object.entries(sections).map(([title, data]) => ({
			title,
			data,
		}));

		if (includeMyProfile && searchFilter.length === 0) {
			result.unshift({
				title: 'My profile',
				data: [{ url: myProfileURL as string } as IContactRecord],
			});
		}

		return result;
	}, [filteredContacts, myProfileURL, includeMyProfile, searchFilter]);

	return (
		<SectionList
			sections={sectionedContacts as any}
			keyExtractor={(item: IContactRecord): string => item.url}
			ItemSeparatorComponent={Divider}
			SectionSeparatorComponent={Divider}
			ListEmptyComponent={Empty}
			renderSectionHeader={({ section: { title } }): ReactElement => (
				<ThemedView color={sectionBackgroundColor} style={styles.sectionHeader}>
					<Caption13Up color="gray1">{title}</Caption13Up>
				</ThemedView>
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
