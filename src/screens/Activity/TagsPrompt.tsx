import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Subtitle, BodyS, Text13UP } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SafeAreaInset from '../../components/SafeAreaInset';
import Tag from '../../components/Tag';
import { closeSheet } from '../../store/slices/ui';
import { lastUsedTagsSelector } from '../../store/reselect/metadata';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const TagsPrompt = ({
	tags,
	onAddTag,
}: {
	tags: string[];
	onAddTag: (tag: string) => void;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const snapPoints = useSnapPoints('medium');
	const dispatch = useAppDispatch();
	const lastUsed = useAppSelector(lastUsedTagsSelector);
	const suggestions = lastUsed.filter((tg) => !tags.includes(tg));

	useBottomSheetBackPress('tagsPrompt');

	const handleClose = (): void => {
		dispatch(closeSheet('tagsPrompt'));
	};

	return (
		<BottomSheetWrapper
			view="tagsPrompt"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleClose}>
			<View style={styles.root}>
				<Subtitle style={styles.title}>{t('tags_filter_title')}</Subtitle>

				<Text13UP color="secondary">{t('tags_filter')}</Text13UP>

				<View style={styles.suggestionsRow}>
					{suggestions.map((tag) => (
						<Tag
							key={tag}
							style={styles.tag}
							value={tag}
							onPress={(): void => onAddTag(tag)}
						/>
					))}
					{suggestions.length === 0 && (
						<BodyS style={styles.noTags}>{t('tags_no')}</BodyS>
					)}
				</View>

				<SafeAreaInset type="bottom" minPadding={16} />
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
	suggestionsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 16,
		marginBottom: -8,
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
	noTags: {
		marginTop: 16,
	},
});

export default memo(TagsPrompt);
