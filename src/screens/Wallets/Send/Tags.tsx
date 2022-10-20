import React, { memo, ReactElement, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import { BottomSheetTextInput, Caption13Up } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Tag from '../../../components/Tag';
import Store from '../../../store/types';
import { addTxTag } from '../../../store/actions/wallet';
import { addTag, deleteTag } from '../../../store/actions/metadata';
import { showErrorNotification } from '../../../utils/notifications';
import type { SendScreenProps } from '../../../navigation/types';

const Tags = ({ navigation }: SendScreenProps<'Tags'>): ReactElement => {
	const [text, setText] = useState('');
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const lastUsedTags = useSelector(
		(store: Store) => store.metadata.lastUsedTags,
	);

	const navigateBack = (): void => {
		// wait for keyboard to close
		const subscription = Keyboard.addListener('keyboardDidHide', (): void => {
			navigation.goBack();
			subscription.remove();
		});
		Keyboard.dismiss();
	};

	const handleSubmit = (): void => {
		if (text.length === 0) {
			return;
		}
		const res = addTxTag({ tag: text, selectedNetwork, selectedWallet });
		if (res.isErr()) {
			showErrorNotification({
				title: 'Error Adding Tag',
				message: res.error.message,
			});
			return;
		}
		addTag(text);
		navigateBack();
	};

	const handleTagChoose = (tag: string): void => {
		const res = addTxTag({ tag, selectedNetwork, selectedWallet });
		if (res.isErr()) {
			showErrorNotification({
				title: 'Error Adding Tag',
				message: res.error.message,
			});
			return;
		}
		addTag(tag);
		navigateBack();
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Add Tag" />
			<View style={styles.content}>
				{lastUsedTags.length !== 0 && (
					<>
						<Caption13Up color="gray1" style={styles.section}>
							PREVIOUSLY USED TAGS
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
					NEW TAG
				</Caption13Up>
				<BottomSheetTextInput
					placeholder="Enter a new tag"
					blurOnSubmit={false}
					value={text}
					onChangeText={setText}
					onSubmitEditing={handleSubmit}
					maxLength={15}
					returnKeyType="done"
				/>
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
});

export default memo(Tags);
