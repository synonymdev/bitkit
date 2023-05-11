import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { View } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Tag from '../../../components/Tag';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
import { deleteTag } from '../../../store/actions/metadata';
import { SettingsScreenProps } from '../../../navigation/types';

const TagsSettings = ({
	navigation,
}: SettingsScreenProps<'TagsSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const lastUsedTags = useSelector(lastUsedTagsSelector);

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('general.tags')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<View style={styles.content}>
				{lastUsedTags.length !== 0 && (
					<>
						<Caption13Up color="gray1" style={styles.section}>
							{t('general.tags_previously')}
						</Caption13Up>
						<View style={styles.tagsContainer}>
							{lastUsedTags.map((tag) => (
								<Tag
									key={tag}
									style={styles.tag}
									value={tag}
									icon="trash"
									onDelete={(): void => {
										deleteTag(tag);
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
});

export default TagsSettings;
