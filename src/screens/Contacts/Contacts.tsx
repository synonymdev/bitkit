import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import Clipboard from '@react-native-clipboard/clipboard';

import {
	ClipboardTextIcon,
	CornersOutIcon,
	PlusIcon,
	Text01S,
	View,
	TouchableOpacity as ThemedTouchableOpacity,
	Text02S,
} from '../../styles/components';
import ContactsOnboarding from './ContactsOnboarding';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import SearchInput from '../../components/SearchInput';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import LabeledInput from '../../components/LabeledInput';
import ContactsList from '../../components/ContactsList';
import { toggleView } from '../../store/actions/user';
import Store from '../../store/types';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';
import { handleSlashtagURL } from '../../utils/slashtags';
import { RootStackParamList } from '../../navigation/types';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';

type ContactsScreenProps = StackScreenProps<RootStackParamList, 'Contacts'>;

export const Contacts = (props: ContactsScreenProps): JSX.Element => {
	const onboardedContacts = useSelector(
		(state: Store) => state.slashtags.onboardedContacts,
	);

	return onboardedContacts ? (
		<ContactsScreen {...props} />
	) : (
		<ContactsOnboarding {...props} />
	);
};

const ContactsScreen = ({ navigation }: ContactsScreenProps): JSX.Element => {
	const [searchFilter, setSearchFilter] = useState('');
	const [addContactURL, setAddContactURL] = useState('');
	const [addContacInvalid, setAddContactInvalid] = useState(false);
	const { url: myProfileURL } = useSelectedSlashtag();
	useBottomSheetBackPress('addContactModal');

	const updateContactID = (url: string): void => {
		setAddContactURL(url);
		setAddContactInvalid(false);

		handleSlashtagURL(url, () => setAddContactInvalid(true));
	};

	const pasteAddContact = async (): Promise<void> => {
		let url = await Clipboard.getString();
		url = url.trim();
		updateContactID(url);
	};

	return (
		<View style={styles.container}>
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

			<BottomSheetWrapper
				backdrop={true}
				view="addContactModal"
				snapPoints={[400]}>
				<View style={styles.modalContainer}>
					<BottomSheetNavigationHeader
						title="Add Contact"
						displayBackButton={false}
					/>
					<Text01S color="gray1" style={styles.addContactNote}>
						Add a new contact by scanning a QR or by pasting their key below.
					</Text01S>
					<View style={styles.modalContent}>
						<LabeledInput
							bottomSheet={true}
							label="Add contact"
							value={addContactURL}
							placeholder="Paste a key"
							multiline={true}
							onChange={updateContactID}>
							<TouchableOpacity
								onPress={(): void => {
									navigation.navigate('Scanner');
								}}>
								<CornersOutIcon width={24} height={24} color="brand" />
							</TouchableOpacity>
							<TouchableOpacity onPress={pasteAddContact}>
								<ClipboardTextIcon width={24} height={24} color="brand" />
							</TouchableOpacity>
						</LabeledInput>
						<View style={styles.addContactInvalid}>
							{addContacInvalid && (
								<Text02S color="brand">This is not a valid key.</Text02S>
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
		height: 56,
		width: 56,
		marginLeft: 8,
		borderRadius: 999,
	},
	contacts: {
		flex: 1,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	modalContent: {
		display: 'flex',
		padding: 16,
		backgroundColor: 'transparent',
	},
	addContactNote: {
		marginHorizontal: 16,
		marginVertical: 32,
	},
	addContactInvalid: {
		height: 20,
		marginTop: 16,
		backgroundColor: 'transparent',
	},
});

export default Contacts;
