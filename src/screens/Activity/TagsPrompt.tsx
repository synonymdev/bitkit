import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Subtitle, Text02S, Text13UP } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { closeBottomSheet } from '../../store/actions/ui';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import Tag from '../../components/Tag';
import { useSelector } from 'react-redux';
import Store from '../../store/types';

const TagsPrompt = ({
	onAddTag,
	tags,
}: {
	onAddTag: (tag: string) => void;
	tags: Array<string>;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const snapPoints = useSnapPoints('medium');

	const suggestions = useSelector((store: Store) =>
		store.metadata.lastUsedTags.filter((tg) => !tags.includes(tg)),
	);

	useBottomSheetBackPress('tagsPrompt');

	const handleClose = (): void => {
		closeBottomSheet('tagsPrompt');
	};

	return (
		<BottomSheetWrapper
			view="tagsPrompt"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleClose}>
			<View style={styles.root}>
				<Subtitle style={styles.title}>{t('tags_filter_title')}</Subtitle>

				<Text13UP color="gray1">{t('tags_filter')}</Text13UP>

				<View style={styles.suggestionsRow}>
					{suggestions.map((s) => (
						<Tag
							key={s}
							value={s}
							style={styles.tag}
							onPress={(): void => onAddTag(s)}
							testID={s}
						/>
					))}
					{suggestions.length === 0 && (
						<Text02S style={styles.noTags}>{t('tags_no')}</Text02S>
					)}
				</View>

				<SafeAreaInsets type="bottom" />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		padding: 16,
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
