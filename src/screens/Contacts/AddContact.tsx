import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { toggleView } from '../../store/actions/user';
import { handleSlashtagURL } from '../../utils/slashtags';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import LabeledInput from '../../components/LabeledInput';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import {
	ClipboardTextIcon,
	CornersOutIcon,
	Text01S,
	Text02S,
} from '../../styles/components';

const AddContact = ({ navigation }): JSX.Element => {
	const snapPoints = useSnapPoints('small');
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
	},
	content: {
		display: 'flex',
		paddingHorizontal: 16,
	},
	addContactNote: {
		marginHorizontal: 16,
		marginBottom: 56,
	},
	addContactInvalid: {
		marginTop: 16,
	},
});

export default AddContact;
