import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Tag from '../../../components/Tag';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
import { deleteLastUsedTag } from '../../../store/slices/metadata';
import { SettingsScreenProps } from '../../../navigation/types';

const TagsSettings = ({
	navigation,
}: SettingsScreenProps<'TagsSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const lastUsedTags = useAppSelector(lastUsedTagsSelector);

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('general.tags')} />
			<View style={styles.content}>
				{lastUsedTags.length !== 0 && (
					<>
						<View style={styles.label}>
							<Caption13Up color="secondary">
								{t('general.tags_previously')}
							</Caption13Up>
						</View>
						<View style={styles.tagsContainer}>
							{lastUsedTags.map((tag) => (
								<Tag
									key={tag}
									style={styles.tag}
									value={tag}
									icon="trash"
									onDelete={(): void => {
										dispatch(deleteLastUsedTag(tag));

										if (lastUsedTags.length === 1) {
											navigation.goBack();
										}
									}}
								/>
							))}
						</View>
					</>
				)}
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
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
	label: {
		justifyContent: 'center',
		height: 50,
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
});

export default TagsSettings;
