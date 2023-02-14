import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Clipboard from '@react-native-clipboard/clipboard';

import { closeBottomSheet } from '../../store/actions/ui';
import { handleSlashtagURL } from '../../utils/slashtags';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import LabeledInput from '../../components/LabeledInput';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { Text01S, Text02S } from '../../styles/text';
import { ClipboardTextIcon, CornersOutIcon } from '../../styles/icons';
import type { RootStackParamList } from '../../navigation/types';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { SlashURL } from '@synonymdev/slashtags-sdk';

const AddContact = ({
	navigation,
}: {
	navigation: StackNavigationProp<RootStackParamList, 'Contacts'>;
}): JSX.Element => {
	const snapPoints = useSnapPoints('small');
	const [addContactURL, setAddContactURL] = useState('');
	const [error, setError] = useState<boolean | string>(false);
	const { url: myProfileURL } = useSelectedSlashtag();

	useBottomSheetBackPress('addContactModal');

	const updateContactID = (url: string): void => {
		setAddContactURL(url);
		setError(false);

		if (url === '') {
			return;
		} else if (url === myProfileURL) {
			setError('You cannot add yourself as a contact.');
			return;
		} else if (!url.startsWith('slash:')) {
			// Handle z32 key without slash: scheme prefix
			try {
				SlashURL.decode(url);
				handleSlashtagURL('slash:' + url, onError, onContact);
			} catch {
				onError();
			}
		} else {
			handleSlashtagURL(url, onError, onContact);
		}

		function onError(): void {
			setError('This is not a valid key.');
		}

		function onContact(): void {
			setAddContactURL('');
			closeBottomSheet('addContactModal');
		}
	};

	const pasteAddContact = async (): Promise<void> => {
		let url = await Clipboard.getString();
		url = url.trim();
		updateContactID(url);
	};

	const navigateToScanner = (): void => {
		navigation.navigate('Scanner');
	};

	return (
		<BottomSheetWrapper
			view="addContactModal"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title="Add Contact"
					displayBackButton={false}
				/>
				<Text01S color="gray1" style={styles.addContactNote}>
					Add a new contact by scanning a QR or by pasting their key below.
				</Text01S>
				<View style={styles.content}>
					<LabeledInput
						bottomSheet={true}
						label="Add contact"
						value={addContactURL}
						placeholder="Paste a key"
						multiline={true}
						onChange={updateContactID}>
						<TouchableOpacity onPress={navigateToScanner}>
							<CornersOutIcon width={24} height={24} color="brand" />
						</TouchableOpacity>
						<TouchableOpacity onPress={pasteAddContact}>
							<ClipboardTextIcon width={24} height={24} color="brand" />
						</TouchableOpacity>
					</LabeledInput>

					{error && (
						<View style={styles.error}>
							<Text02S color="brand">{error}</Text02S>
						</View>
					)}
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 16,
	},
	addContactNote: {
		marginHorizontal: 16,
		marginBottom: 56,
	},
	error: {
		marginTop: 16,
	},
});

export default AddContact;
