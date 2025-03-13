import React, { memo, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import SafeAreaInset from '../components/SafeAreaInset';
import Tag from '../components/Tag';
import Button from '../components/buttons/Button';
import { Keyboard } from '../hooks/keyboard';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useSheetRef } from '../sheets/SheetRefsProvider';
import { lastUsedTagsSelector } from '../store/reselect/metadata';
import { addMetaTxTag } from '../store/slices/metadata';
import { SheetsParamList } from '../store/types/ui';
import { BottomSheetTextInput } from '../styles/components';
import { Subtitle, Text13UP } from '../styles/text';

const sheetId = 'activityTags';

const SheetContent = ({
	data,
}: {
	data: SheetsParamList['activityTags'];
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const sheetRef = useSheetRef(sheetId);
	const [text, setText] = useState('');
	const dispatch = useAppDispatch();
	const lastUsedTags = useAppSelector(lastUsedTagsSelector);

	const { id } = data;

	const closeBottomSheet = async (): Promise<void> => {
		await Keyboard.dismiss();
		sheetRef.current?.close();
		setText('');
	};

	const handleTagChoose = (tag: string): void => {
		dispatch(addMetaTxTag({ txId: id, tag: tag }));
		closeBottomSheet();
	};

	const handleSubmit = (): void => {
		if (text.length === 0) {
			return;
		}
		dispatch(addMetaTxTag({ txId: id, tag: text }));
		closeBottomSheet();
	};

	return (
		<View style={styles.root}>
			<Subtitle style={styles.title}>{t('tags_add')}</Subtitle>

			{lastUsedTags.length !== 0 && (
				<>
					<Text13UP style={styles.label} color="secondary">
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
							/>
						))}
					</View>
				</>
			)}

			<Text13UP style={styles.label} color="secondary">
				{t('tags_new')}
			</Text13UP>
			<BottomSheetTextInput
				placeholder={t('tags_new_enter')}
				backgroundColor="white08"
				minHeight={52}
				blurOnSubmit={true}
				value={text}
				autoFocus={true}
				maxLength={15}
				returnKeyType="done"
				testID="TagInput"
				onChangeText={setText}
				onBlur={handleSubmit}
			/>

			<View style={styles.buttonContainer}>
				<Button
					text={t('tags_add_button')}
					size="large"
					disabled={text.length === 0}
					testID="ActivityTagsSubmit"
					onPress={handleSubmit}
				/>
			</View>

			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const ActivityTags = (): ReactElement => {
	return (
		<BottomSheet id={sheetId} size="small">
			{({ data }: { data: SheetsParamList['activityTags'] }) => {
				return <SheetContent data={data} />;
			}}
		</BottomSheet>
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
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ActivityTags);
