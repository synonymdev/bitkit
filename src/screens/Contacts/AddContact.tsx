import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { parse } from '@synonymdev/slashtags-url';
import React, { ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import LabeledInput from '../../components/LabeledInput';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { useAppDispatch } from '../../hooks/redux';
import { useSlashtags } from '../../hooks/slashtags';
import type { RootStackParamList } from '../../navigation/types';
import { closeSheet } from '../../store/slices/ui';
import { ClipboardTextIcon, CornersOutIcon } from '../../styles/icons';
import { BodyM } from '../../styles/text';
import { handleSlashtagURL } from '../../utils/slashtags';

const AddContact = ({
	navigation,
}: {
	navigation: NativeStackNavigationProp<RootStackParamList, 'Contacts'>;
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
		} catch (_e) {
			setError(t('contact_error_key'));
			return;
		}

		try {
			if (parse(contactUrl).id === parse(myProfileURL).id) {
				setError(t('contact_error_yourself'));
				return;
			}
		} catch (_e) {}

		const onError = (): void => {
			setError(t('contact_error_key'));
		};

		const onContact = (): void => {
			setUrl('');
			// Add delay to prevent sheet from staying open
			setTimeout(() => dispatch(closeSheet('addContactModal')), 500);
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
		<BottomSheetWrapper view="addContactModal" snapPoints={snapPoints}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('contact_add_capital')}
					showBackButton={false}
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
							activeOpacity={0.7}
							hitSlop={styles.hitSlop}
							onPress={handleScanner}>
							<CornersOutIcon width={24} height={24} color="brand" />
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.action}
							activeOpacity={0.7}
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
