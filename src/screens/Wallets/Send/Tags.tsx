import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { BottomSheetTextInput } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Tag from '../../../components/Tag';
import Button from '../../../components/Button';
import { showErrorNotification } from '../../../utils/notifications';
import { Keyboard } from '../../../hooks/keyboard';
import { addTxTag } from '../../../store/actions/wallet';
import { addTag } from '../../../store/actions/metadata';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import type { SendScreenProps } from '../../../navigation/types';

const Tags = ({ navigation }: SendScreenProps<'Tags'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const [text, setText] = useState('');
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const lastUsedTags = useSelector(lastUsedTagsSelector);

	const handleSubmit = async (): Promise<void> => {
		if (text.length === 0) {
			return;
		}
		const res = addTxTag({ tag: text, selectedNetwork, selectedWallet });
		if (res.isErr()) {
			showErrorNotification({
				title: t('tags_add_error_header'),
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
				title: t('tags_add_error_header'),
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
