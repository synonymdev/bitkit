import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';
import { handleSlashtagURL } from '../../utils/slashtags';
import LabeledInput from '../../components/LabeledInput';
import {
	ClipboardTextIcon,
	CornersOutIcon,
	Text01S,
	View,
	Text02S,
} from '../../styles/components';
import { toggleView } from '../../store/actions/user';

const AddContact = ({ navigation }): JSX.Element => {
	const [addContactURL, setAddContactURL] = useState('');
	const [addContacInvalid, setAddContactInvalid] = useState(false);

	useBottomSheetBackPress('addContactModal');

	const updateContactID = (url: string): void => {
		setAddContactURL(url);
		setAddContactInvalid(false);

		handleSlashtagURL(
			url,
			(_error) => setAddContactInvalid(true),
			(_url) => {
				setAddContactURL('');
				toggleView({
					view: 'addContactModal',
					data: { isOpen: false },
				});
			},
		);
	};

	const pasteAddContact = async (): Promise<void> => {
		let url = await Clipboard.getString();
		url = url.trim();
		updateContactID(url);
	};

	return (
		<BottomSheetWrapper
			backdrop={true}
			view="addContactModal"
			snapPoints={[400]}>
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
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	content: {
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

export default AddContact;
