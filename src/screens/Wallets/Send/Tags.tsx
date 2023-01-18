import React, { memo, ReactElement, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetTextInput } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Tag from '../../../components/Tag';
import Button from '../../../components/Button';
import { showErrorNotification } from '../../../utils/notifications';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import { addTxTag } from '../../../store/actions/wallet';
import { addTag, deleteTag } from '../../../store/actions/metadata';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import type { SendScreenProps } from '../../../navigation/types';

const Tags = ({ navigation }: SendScreenProps<'Tags'>): ReactElement => {
	const { keyboardShown } = useKeyboard();
	const insets = useSafeAreaInsets();
	const [text, setText] = useState('');
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const lastUsedTags = useSelector(lastUsedTagsSelector);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			// extra padding needed because of KeyboardAvoidingView
			paddingBottom: keyboardShown
				? Platform.OS === 'ios'
					? 16
					: 40
				: insets.bottom + 16,
		}),
		[keyboardShown, insets.bottom],
	);

	const handleSubmit = async (): Promise<void> => {
		if (text.length === 0) {
			return;
		}
		const res = addTxTag({ tag: text, selectedNetwork, selectedWallet });
		if (res.isErr()) {
			showErrorNotification({
				title: 'Error Adding Tag',
				message: res.error.message,
			});
			return;
		}
		addTag(text);

		await Keyboard.dismiss();
		navigation.goBack();
	};

	const handleTagChoose = async (tag: string): Promise<void> => {
		const res = addTxTag({ tag, selectedNetwork, selectedWallet });
		if (res.isErr()) {
			showErrorNotification({
				title: 'Error Adding Tag',
				message: res.error.message,
			});
			return;
		}
		addTag(tag);

		await Keyboard.dismiss();
		navigation.goBack();
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Add Tag" />
			<View style={styles.content}>
				{lastUsedTags.length !== 0 && (
					<>
						<Caption13Up color="gray1" style={styles.section}>
							Previously used tags
						</Caption13Up>
						<View style={styles.tagsContainer}>
							{lastUsedTags.map((tag) => (
								<Tag
									key={tag}
									value={tag}
									style={styles.tag}
									onPress={(): void => {
										handleTagChoose(tag);
									}}
									onClose={(): void => {
										deleteTag(tag);
									}}
								/>
							))}
						</View>
					</>
				)}
				<Caption13Up color="gray1" style={styles.section}>
					New tag
				</Caption13Up>
				<BottomSheetTextInput
					placeholder="Enter a new tag"
					blurOnSubmit={false}
					value={text}
					onChangeText={setText}
					onSubmitEditing={handleSubmit}
					maxLength={15}
					returnKeyType="done"
				/>

				<View style={buttonContainerStyles}>
					<Button
						text="Add"
						size="large"
						disabled={text.length === 0}
						onPress={handleSubmit}
					/>
				</View>
			</View>
		</GradientView>
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
	section: {
		marginBottom: 16,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 32,
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
	buttonContainer: {
		marginTop: 'auto',
		flex: 1,
		justifyContent: 'flex-end',
	},
});

export default memo(Tags);
