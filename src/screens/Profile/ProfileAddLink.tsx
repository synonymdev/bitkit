import React, { useMemo, ReactElement, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View as ThemedView, Text02S, Text02B } from '../../styles/components';
import Button from '../../components/Button';
import LabeledInput from '../../components/LabeledInput';
import { RootStackScreenProps } from '../../navigation/types';
import Store from '../../store/types';
import { updateProfileLink } from '../../store/actions/ui';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { addLink } from '../../store/actions/slashtags';

export const ProfileAddLinkForm = ({
	navigation,
}: RootStackScreenProps<'ProfileAddLink'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const form = useSelector((state: Store) => state.ui.profileLink);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const saveLink = useCallback((): void => {
		addLink({ title: form.title, url: form.url });
		updateProfileLink({ title: '', url: '' });
		navigation.goBack();
	}, [form, navigation]);

	const isValid = form.title?.length > 0 && form.url?.length > 0;

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Add Link" />
			<View style={styles.content}>
				<LabeledInput
					style={styles.input}
					label="Label"
					placeholder="For example 'Website'"
					value={form.title}
					maxLength={25}
					onChange={(value: string): void => {
						updateProfileLink({ ...form, title: value });
					}}>
					<TouchableOpacity
						onPress={(): void => {
							navigation.navigate('ProfileLinkSuggestions');
						}}>
						<Text02B color="brand">Suggestions</Text02B>
					</TouchableOpacity>
				</LabeledInput>
				<LabeledInput
					style={styles.input}
					label="Link or text"
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
					Note: Any link you add will be publicly visible.
				</Text02S>

				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						text="Save"
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

export default ProfileAddLinkForm;
