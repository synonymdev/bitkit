import React, { ReactElement, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Clipboard from '@react-native-clipboard/clipboard';
import { parse } from '@synonymdev/slashtags-url';
import { useTranslation } from 'react-i18next';

import { closeSheet } from '../../store/slices/ui';
import { handleSlashtagURL } from '../../utils/slashtags';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import LabeledInput from '../../components/LabeledInput';
import Button from '../../components/Button';
import SafeAreaInset from '../../components/SafeAreaInset';
import { BodyM } from '../../styles/text';
import { ClipboardTextIcon, CornersOutIcon } from '../../styles/icons';
import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch } from '../../hooks/redux';
import { useSlashtags } from '../../hooks/slashtags';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const AddContact = ({
	navigation,
}: {
	navigation: StackNavigationProp<RootStackParamList, 'Contacts'>;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const snapPoints = useSnapPoints('small');
	const dispatch = useAppDispatch();
	const [url, setUrl] = useState('');
	const [error, setError] = useState<undefined | string>();
	const { url: myProfileURL } = useSlashtags();

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
			dispatch(closeSheet('addContactModal'));
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

				<View style={styles.content}>
					<BodyM style={styles.text} color="secondary" testID="AddContactNote">
						{t('contact_add_explain')}
					</BodyM>
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
						<TouchableOpacity
							style={styles.action}
							hitSlop={styles.hitSlop}
							onPress={handleScanner}>
							<CornersOutIcon width={24} height={24} color="brand" />
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.action}
							hitSlop={styles.hitSlop}
							onPress={handlePaste}>
							<ClipboardTextIcon width={24} height={24} color="brand" />
						</TouchableOpacity>
					</LabeledInput>

					<Button
						style={styles.button}
						size="large"
						disabled={!url || Boolean(error)}
						text={t('contact_add_button')}
						testID="AddContactButton"
						onPress={(): void => handleAddContact()}
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
		flex: 1,
		paddingHorizontal: 16,
	},
	text: {
		marginBottom: 32,
	},
	button: {
		marginTop: 'auto',
	},
	action: {
		width: 40,
	},
	hitSlop: {
		top: 10,
		bottom: 10,
		left: 10,
		right: 10,
	},
});

export default AddContact;
