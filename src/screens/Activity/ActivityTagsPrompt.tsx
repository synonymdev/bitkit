import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { BottomSheetTextInput } from '../../styles/components';
import { Subtitle, Text13UP } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { closeBottomSheet } from '../../store/actions/ui';
import Tag from '../../components/Tag';
import { addMetaTxTag, addTag, deleteTag } from '../../store/actions/metadata';
import { sleep } from '../../utils/helpers';
import { showErrorNotification } from '../../utils/notifications';
import { useAppSelector } from '../../hooks/redux';
import { viewControllerSelector } from '../../store/reselect/ui';
import { lastUsedTagsSelector } from '../../store/reselect/metadata';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const Form = ({ id }: { id: string }): ReactElement => {
	const { t } = useTranslation('wallet');
	const [text, setText] = useState('');
	const lastUsedTags = useSelector(lastUsedTagsSelector);

	const handleTagChoose = async (tag: string): Promise<void> => {
		const res = addMetaTxTag(id, tag);
		if (res.isErr()) {
			showErrorNotification({
				title: t('tags_add_error_header'),
				message: res.error.message,
			});
			return;
		}
		addTag(tag);
		Keyboard.dismiss();
		await sleep(500); // await for keyboard to close
		closeBottomSheet('activityTagsPrompt');
	};

	const handleInputBlur = async (): Promise<void> => {
		if (text.length === 0) {
			return;
		}
		const res = addMetaTxTag(id, text);
		if (res.isErr()) {
			showErrorNotification({
				title: t('tags_add_error_header'),
				message: res.error.message,
			});
			return;
		}
		addTag(text);
		await sleep(500); // await for keyboard to close
		closeBottomSheet('activityTagsPrompt');
	};

	return (
		<>
			{lastUsedTags.length !== 0 && (
				<>
					<Text13UP color="gray1" style={styles.label}>
						{t('tags_previously')}
					</Text13UP>
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

			<Text13UP color="gray1" style={styles.label}>
				{t('tags_new')}
			</Text13UP>
			<BottomSheetTextInput
				placeholder={t('tags_new_enter')}
				backgroundColor="white08"
				minHeight={52}
				blurOnSubmit={true}
				value={text}
				onChangeText={setText}
				onBlur={handleInputBlur}
				autoFocus={true}
				maxLength={15}
				returnKeyType="done"
				testID="TagInput"
			/>
		</>
	);
};

const ActivityTagsPrompt = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const snapPoints = useSnapPoints('small');
	const { isOpen, id } = useAppSelector((state) => {
		return viewControllerSelector(state, 'activityTagsPrompt');
	});

	useBottomSheetBackPress('activityTagsPrompt');

	const handleClose = (): void => {
		closeBottomSheet('activityTagsPrompt');
	};

	return (
		<BottomSheetWrapper
			view="activityTagsPrompt"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleClose}>
			<View style={styles.root}>
				<Subtitle style={styles.title}>{t('tags_add')}</Subtitle>

				{isOpen && id && <Form id={id} />}

				<SafeAreaInsets type="bottom" />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 16,
	},
	title: {
		marginBottom: 25,
		textAlign: 'center',
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
	label: {
		marginBottom: 16,
	},
});

export default memo(ActivityTagsPrompt);
