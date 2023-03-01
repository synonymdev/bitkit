import React, { useMemo, ReactElement, useCallback, memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { Text02S, Text02B } from '../../styles/text';
import Button from '../../components/Button';
import LabeledInput from '../../components/LabeledInput';
import { RootStackScreenProps } from '../../navigation/types';
import { updateProfileLink } from '../../store/actions/ui';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { addLink } from '../../store/actions/slashtags';
import { useAppSelector } from '../../hooks/redux';
import { profileLinkSelector } from '../../store/reselect/ui';

export const ProfileAddLinkForm = ({
	navigation,
}: RootStackScreenProps<'ProfileAddLink'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const insets = useSafeAreaInsets();
	const form = useAppSelector(profileLinkSelector);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const saveLink = useCallback((): void => {
		addLink(form);
		updateProfileLink({ title: '', url: '' });
		navigation.goBack();
	}, [form, navigation]);

	const isValid = useMemo(
		() => form.title?.length > 0 && form.url?.length > 0,
		[form.title?.length, form.url?.length],
	);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title={t('profile_add_link')} />
			<View style={styles.content}>
				<LabeledInput
					style={styles.input}
					label={t('profile_link_label')}
					placeholder={t('profile_link_label_placeholder')}
					value={form.title}
					maxLength={25}
					onChange={(value: string): void => {
						updateProfileLink({ ...form, title: value });
					}}>
					<TouchableOpacity
						onPress={(): void => {
							navigation.navigate('ProfileLinkSuggestions');
						}}>
						<Text02B color="brand">{t('profile_link_suggestions')}</Text02B>
					</TouchableOpacity>
				</LabeledInput>
				<LabeledInput
					style={styles.input}
					label={t('profile_link_value')}
					placeholder="https://"
					value={form.url}
					multiline={true}
					returnKeyType="default"
					maxLength={2048}
					onChange={(value: string): void => {
						updateProfileLink({ ...form, url: value });
					}}
				/>
				<Text02S style={styles.note} color="gray1">
					{t('profile_link_public')}
				</Text02S>

				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						text={t('save')}
						size="large"
						disabled={!isValid}
						onPress={saveLink}
					/>
				</View>
			</View>
		</ThemedView>
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
	input: {
		marginBottom: 16,
	},
	note: {
		marginTop: 32,
	},
	buttonContainer: {
		marginTop: 16,
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
});

export default memo(ProfileAddLinkForm);
