import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { BodySB, BodyS } from '../../styles/text';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/Button';
import LabeledInput from '../../components/LabeledInput';
import SafeAreaInset from '../../components/SafeAreaInset';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';
import { Keyboard } from '../../hooks/keyboard';
import { ProfileLinkScreenProps } from '../../navigation/types';
import { addLink } from '../../store/slices/slashtags';
import { closeSheet, updateProfileLink } from '../../store/slices/ui';
import { profileLinkSelector } from '../../store/reselect/ui';
import { suggestions } from './ProfileLinkSuggestions';

const ProfileLink = ({
	navigation,
}: ProfileLinkScreenProps<'ProfileLink'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();
	const form = useAppSelector(profileLinkSelector);

	useBottomSheetBackPress('profileAddDataForm');

	const onSave = async (): Promise<void> => {
		dispatch(addLink(form));
		dispatch(updateProfileLink({ title: '', url: '' }));
		await Keyboard.dismiss();
		dispatch(closeSheet('profileAddDataForm'));
	};

	const isValid = form.title && form.url;
	const selectedSuggestion = suggestions.find((s) => s.title === form.title);
	const placeholder = selectedSuggestion?.prefix ?? 'https://';

	return (
		<View style={styles.content}>
			<BottomSheetNavigationHeader
				title={t('profile_add_link')}
				displayBackButton={false}
			/>
			<LabeledInput
				style={styles.titleInput}
				bottomSheet={true}
				label={t('profile_link_label')}
				placeholder={t('profile_link_label_placeholder')}
				value={form.title}
				maxLength={25}
				testID="LinkLabelInput"
				onChange={(value: string): void => {
					dispatch(updateProfileLink({ ...form, title: value }));
				}}>
				<TouchableOpacity
					testID="ProfileLinkSuggestions"
					onPress={(): void => {
						navigation.navigate('ProfileLinkSuggestions');
					}}>
					<BodySB color="brand">{t('profile_link_suggestions')}</BodySB>
				</TouchableOpacity>
			</LabeledInput>
			<LabeledInput
				bottomSheet={true}
				label={t('profile_link_value')}
				placeholder={placeholder}
				value={form.url}
				multiline={true}
				returnKeyType="default"
				maxLength={2048}
				testID="LinkValueInput"
				onChange={(value: string): void => {
					dispatch(updateProfileLink({ ...form, url: value }));
				}}
			/>
			<BodyS style={styles.note} color="secondary">
				{t('profile_link_public')}
			</BodyS>

			<View style={styles.buttonContainer}>
				<Button
					style={styles.button}
					text={t('save')}
					size="large"
					disabled={!isValid}
					testID="SaveLink"
					onPress={onSave}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	titleInput: {
		marginBottom: 16,
	},
	note: {
		marginTop: 'auto',
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
});

export default ProfileLink;
