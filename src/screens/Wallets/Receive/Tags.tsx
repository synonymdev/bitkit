import React, { memo, ReactElement, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheetTextInput } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
import { Keyboard } from '../../../hooks/keyboard';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
import { updateInvoice } from '../../../store/slices/receive';
import { ReceiveScreenProps } from '../../../navigation/types';

const Tags = ({ navigation }: ReceiveScreenProps<'Tags'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const [text, setText] = useState('');
	const dispatch = useAppDispatch();
	const lastUsedTags = useAppSelector(lastUsedTagsSelector);

	const handleSubmit = useCallback(async (): Promise<void> => {
		if (text.length === 0) {
			return;
		}
		dispatch(updateInvoice({ tags: [text] }));
		await Keyboard.dismiss();
		navigation.goBack();
	}, [navigation, dispatch, text]);

	const handleTagChoose = useCallback(
		async (tag: string): Promise<void> => {
			dispatch(updateInvoice({ tags: [tag] }));
			await Keyboard.dismiss();
			navigation.goBack();
		},
		[navigation, dispatch],
	);

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
					testID="TagInputReceive"
				/>

				<View style={styles.buttonContainer}>
					<Button
						text={t('tags_add_button')}
						size="large"
						disabled={text.length === 0}
						testID="ReceiveTagsSubmit"
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
