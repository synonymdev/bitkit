import React, { memo, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Tag from '../../../components/Tag';
import Button from '../../../components/buttons/Button';
import { Keyboard } from '../../../hooks/keyboard';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import type { SendScreenProps } from '../../../navigation/types';
import { addTxTag } from '../../../store/actions/wallet';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
import { addLastUsedTag } from '../../../store/slices/metadata';
import { BottomSheetTextInput } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import { showToast } from '../../../utils/notifications';

const Tags = ({ navigation }: SendScreenProps<'Tags'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const [text, setText] = useState('');
	const dispatch = useAppDispatch();
	const lastUsedTags = useAppSelector(lastUsedTagsSelector);

	const handleSubmit = async (): Promise<void> => {
		if (text.length === 0) {
			return;
		}
		const res = addTxTag({ tag: text });
		if (res.isErr()) {
			console.log(res.error.message);
			showToast({
				type: 'warning',
				title: t('tags_add_error_header'),
				description: t('tags_add_error_description'),
			});
			return;
		}
		dispatch(addLastUsedTag(text));

		await Keyboard.dismiss();
		navigation.goBack();
	};

	const handleTagChoose = async (tag: string): Promise<void> => {
		const res = addTxTag({ tag });
		if (res.isErr()) {
			console.log(res.error.message);
			showToast({
				type: 'warning',
				title: t('tags_add_error_header'),
				description: t('tags_add_error_description'),
			});
			return;
		}
		dispatch(addLastUsedTag(tag));

		await Keyboard.dismiss();
		navigation.goBack();
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('tags_add')} />
			<View style={styles.content}>
				{lastUsedTags.length !== 0 && (
					<>
						<Caption13Up color="secondary" style={styles.section}>
							{t('tags_previously')}
						</Caption13Up>
						<View style={styles.tagsContainer}>
							{lastUsedTags.map((tag) => (
								<Tag
									key={tag}
									style={styles.tag}
									value={tag}
									onPress={(): void => {
										handleTagChoose(tag);
									}}
								/>
							))}
						</View>
					</>
				)}
				<Caption13Up color="secondary" style={styles.section}>
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
					testID="TagInputSend"
				/>

				<View style={styles.buttonContainer}>
					<Button
						text={t('tags_add_button')}
						size="large"
						disabled={text.length === 0}
						onPress={handleSubmit}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
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
