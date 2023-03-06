import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BottomSheetTextInput } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
import { updateInvoice } from '../../../store/actions/receive';
import { addTag, deleteTag } from '../../../store/actions/metadata';
import { ReceiveScreenProps } from '../../../navigation/types';

const Tags = ({ navigation }: ReceiveScreenProps<'Tags'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { keyboardShown } = useKeyboard();
	const insets = useSafeAreaInsets();
	const [text, setText] = useState('');
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

	const handleSubmit = useCallback(async (): Promise<void> => {
		if (text.length === 0) {
			return;
		}
		updateInvoice({ tags: [text] });
		addTag(text);
		await Keyboard.dismiss();
		navigation.goBack();
	}, [navigation, text]);

	const handleTagChoose = useCallback(
		async (tag: string): Promise<void> => {
			updateInvoice({ tags: [tag] });
			addTag(tag);
			await Keyboard.dismiss();
			navigation.goBack();
		},
		[navigation],
	);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('tags_add')} />
			<View style={styles.content}>
				{lastUsedTags.length !== 0 && (
					<>
						<Caption13Up color="gray1" style={styles.section}>
							{t('tags_previously')}
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
					{t('tags_new')}
				</Caption13Up>
				<BottomSheetTextInput
					placeholder={t('tags_new_enter')}
					blurOnSubmit={false}
					value={text}
					onChangeText={setText}
					onSubmitEditing={handleSubmit}
					maxLength={15}
					returnKeyType="done"
				/>

				<View style={buttonContainerStyles}>
					<Button
						text={t('tags_add_button')}
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
