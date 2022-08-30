import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';

import {
	Caption13Up,
	ClipboardTextIcon,
	CornersOutIcon,
	PlusIcon,
	Subtitle,
	Text,
	Text01S,
	View,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ContactsOnboarding from './ContactsOnboarding';
import SearchInput from '../../components/SearchInput';
import ContactItem from '../../components/ContactItem';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import LabeledInput from '../../components/LabeledInput';
import { toggleView } from '../../store/actions/user';
import Store from '../../store/types';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { handleSlashtagURL } from '../../utils/slashtags';
import { IContactRecord } from '../../store/types/slashtags';
import { useSlashtagsContacts } from '../../components/SlashtagContactsProvider';

export const Contacts = ({ navigation }): JSX.Element => {
	const onboardedContacts = useSelector(
		(state: Store) => state.slashtags.onboardedContacts,
	);

	return onboardedContacts ? (
		<ContactsScreen navigation={navigation} />
	) : (
		<ContactsOnboarding navigation={navigation} />
	);
};

const ContactsScreen = ({ navigation }): JSX.Element => {
	const [searchFilter, setSearchFilter] = useState('');
	const [addContactURL, setAddContactURL] = useState('');
	const [addContacInvalid, setAddContactInvalid] = useState(false);

	const { contacts } = useSlashtagsContacts();

	const orderedContacts = useMemo(() => {
		return Object.values(contacts).sort((a, b) => (a.name > b.name ? 1 : -1));
	}, [contacts]);

	const filter = useCallback(
		(name: string): boolean =>
			searchFilter.length === 0
				? true
				: name?.toLowerCase().includes(searchFilter?.toLowerCase()),
		[searchFilter],
	);

	const { url: myProfileURL, profile } = useSelectedSlashtag();

	const sectionedContacts = useMemo(() => {
		const sections: { [char: string]: IContactRecord[] } = {};

		orderedContacts.forEach((contact) => {
			if (filter(contact.name)) {
				const char = contact.name?.slice(0, 1);
				sections[char]
					? sections[char].push(contact)
					: (sections[char] = [contact]);
			}
		});

		const result = Object.entries(sections).map(([title, data]) => ({
			title,
			data,
		}));

		if (profile?.name && filter(profile?.name)) {
			result.unshift({
				title: 'My profile',
				data: [{ ...profile, url: myProfileURL as string } as IContactRecord],
			});
		}
		return result;
	}, [profile, filter, orderedContacts, myProfileURL]);

	const updateContactID = (url: string): void => {
		setAddContactURL(url);
		setAddContactInvalid(false);

		handleSlashtagURL(url, () => setAddContactInvalid(true));
	};

	const pasteAddContact = async (): Promise<void> => {
		let url = await Clipboard.getString();
		updateContactID(url);
	};

	return (
		<View style={styles.container}>
			<SafeAreaInsets type={'top'} />
			<NavigationHeader
				title="Contacts"
				displayBackButton={false}
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
					<TouchableOpacity
						style={styles.addButton}
						activeOpacity={0.8}
						onPress={(): void => {
							toggleView({
								view: 'addContactModal',
								data: { isOpen: true },
							});
						}}>
						<PlusIcon width={24} height={24} color="brand" />
					</TouchableOpacity>
				</View>
				<View style={styles.contacts}>
					<SectionList
						sections={sectionedContacts as any}
						keyExtractor={(item: IContactRecord): string => item.url}
						ItemSeparatorComponent={(): ReactElement => (
							<View style={styles.divider} />
						)}
						SectionSeparatorComponent={(): ReactElement => (
							<View style={styles.divider} />
						)}
						renderSectionHeader={({ section: { title } }): ReactElement => (
							<View style={styles.sectionHeader}>
								<Caption13Up color="gray1">{title}</Caption13Up>
							</View>
						)}
						renderItem={({ item: contact }): ReactElement => (
							<ContactItem
								url={contact.url}
								name={contact.name}
								navigation={navigation}
								isContact={contact.url !== myProfileURL}
							/>
						)}
					/>
				</View>
			</View>

			<BottomSheetWrapper
				backdrop={true}
				view="addContactModal"
				snapPoints={[400]}>
				<View style={styles.modalContainer}>
					<Subtitle style={styles.modalTitle}>Add a contact</Subtitle>
					<Text01S color="gray1" style={styles.addContactNote}>
						Add a new contact by scanning a QR or by pasting their Slashtags key
						below.
					</Text01S>
					<View style={styles.modalContent}>
						<LabeledInput
							bottomSheet={true}
							label="ADD SLASHTAGS CONTACT"
							value={addContactURL}
							placeholder="Paste a Slashtags key"
							onChange={updateContactID}
							rightIcon={
								<View style={styles.addContactsIconsContainer}>
									<TouchableOpacity
										onPress={(): void => {
											navigation.navigate('Scanner');
										}}>
										<CornersOutIcon width={24} height={24} color="brand" />
									</TouchableOpacity>
									<TouchableOpacity onPress={pasteAddContact}>
										<ClipboardTextIcon width={24} height={24} color="brand" />
									</TouchableOpacity>
								</View>
							}
						/>
						<View style={styles.addContactInvalid}>
							{addContacInvalid && (
								<Text color="brand">This is not a valid Slashtags URL.</Text>
							)}
						</View>
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
		justifyContent: 'space-between',
		margin: 20,
		marginTop: 0,
		backgroundColor: 'transparent',
	},
	searchRow: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 32,
	},
	searchInput: {
		flex: 1,
	},
	addButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: 48,
		width: 48,
		marginLeft: 8,
		borderRadius: 999,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	sectionHeader: { height: 24 },
	contacts: {
		flex: 1,
	},
	divider: {
		height: 2,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginTop: 16,
		marginBottom: 16,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	modalTitle: {
		textAlign: 'center',
		marginBottom: 16,
	},
	modalContent: {
		display: 'flex',
		padding: 16,
		backgroundColor: 'transparent',
	},
	addContactNote: {
		padding: 16,
	},
	addContactsIconsContainer: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		backgroundColor: 'transparent',
		width: 56,
	},
	addContactInvalid: {
		height: 20,
		marginTop: 16,
		backgroundColor: 'transparent',
	},
});

export default Contacts;
