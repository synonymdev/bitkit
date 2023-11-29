import React, { ReactElement, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Clipboard from '@react-native-clipboard/clipboard';
import { parse } from '@synonymdev/slashtags-url';
import { useTranslation } from 'react-i18next';

import { closeBottomSheet } from '../../store/actions/ui';
import { handleSlashtagURL } from '../../utils/slashtags';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import LabeledInput from '../../components/LabeledInput';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { Text01S } from '../../styles/text';
import { ClipboardTextIcon, CornersOutIcon } from '../../styles/icons';
import type { RootStackParamList } from '../../navigation/types';
import { useSelectedSlashtag2 } from '../../hooks/slashtags2';
import Button from '../../components/Button';
import SafeAreaInset from '../../components/SafeAreaInset';

const AddContact = ({
	navigation,
}: {
	navigation: StackNavigationProp<RootStackParamList, 'Contacts'>;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const snapPoints = useSnapPoints('small');
	const [url, setUrl] = useState('');
	const [error, setError] = useState<undefined | string>();
	const { url: myProfileURL } = useSelectedSlashtag2();

	useBottomSheetBackPress('addContactModal');

	const handleChangeUrl = (contactUrl: string): void => {
		setUrl(contactUrl);
		setError(undefined);
	};

	const handleAddContact = (contactUrl?: string): void => {
		contactUrl = contactUrl ?? url;
		setError(undefined);
		if (!contactUrl) {
			return;
		}

		try {
			parse(contactUrl);
		} catch (e) {
			setError(t('contact_error_key'));
			return;
		}

		try {
			if (parse(contactUrl).id === parse(myProfileURL).id) {
				setError(t('contact_error_yourself'));
				return;
			}
		} catch (e) {}

		const onError = (): void => {
			setError(t('contact_error_key'));
		};

		const onContact = (): void => {
			setUrl('');
			closeBottomSheet('addContactModal');
		};

		handleSlashtagURL(contactUrl, onError, onContact);
	};

	const updateContactID = async (contactUrl: string): Promise<void> => {
		setUrl(contactUrl);
		handleAddContact(contactUrl);
	};

	const handlePaste = async (): Promise<void> => {
		let contactUrl = await Clipboard.getString();
		contactUrl = contactUrl.trim();
		updateContactID(contactUrl);
	};

	const handleScanner = (): void => {
		navigation.navigate('Scanner', { onScan: updateContactID });
	};

	return (
		<BottomSheetWrapper
			view="addContactModal"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('contact_add_capital')}
					displayBackButton={false}
				/>
				<Text01S color="gray1" style={styles.addContactNote}>
					{t('contact_add_explain')}
				</Text01S>
				<View style={styles.content}>
					<LabeledInput
						bottomSheet={true}
						label={t('contact_add')}
						error={error}
						value={url}
						placeholder={t('contact_key_paste')}
						multiline={true}
						onChange={handleChangeUrl}
						testID="ContactURLInput"
						color={error ? 'brand' : undefined}>
						<TouchableOpacity onPress={handleScanner}>
							<CornersOutIcon width={24} height={24} color="brand" />
						</TouchableOpacity>
						<TouchableOpacity onPress={handlePaste}>
							<ClipboardTextIcon width={24} height={24} color="brand" />
						</TouchableOpacity>
					</LabeledInput>
				</View>

				<View style={styles.footer}>
					<Button
						size="large"
						disabled={!url}
						style={styles.button}
						text={t('contact_add_button')}
						onPress={(): void => handleAddContact()}
						testID="AddContactButton"
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
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
		marginBottom: 16,
	},
	footer: {
		paddingHorizontal: 16,
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
		flex: 1,
		flexDirection: 'row',
	},
	button: {
		marginBottom: 16,
		flex: 1,
	},
});

export default AddContact;
