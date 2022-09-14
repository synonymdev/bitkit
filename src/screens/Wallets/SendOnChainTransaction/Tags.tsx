import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSelector } from 'react-redux';

import {
	BottomSheetTextInput,
	Caption13Up,
	View as ThemedView,
} from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Tag from '../../../components/Tag';
import Store from '../../../store/types';
import useColors from '../../../hooks/colors';
import { addTxTag } from '../../../store/actions/wallet';

const AddressAndAmount = ({ navigation }): ReactElement => {
	const colors = useColors();
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

	const handleInputBlur = (): void => {
		if (text.length === 0) {
			return;
		}
		const res = addTxTag({ tag: text, selectedNetwork, selectedWallet });
		if (res.isErr()) {
			return Alert.alert(res.error.message);
		}
		navigation.goBack();
	};

	const handleTagChoose = (tag: string): void => {
		const res = addTxTag({ tag, selectedNetwork, selectedWallet });
		if (res.isErr()) {
			return Alert.alert(res.error.message);
		}
		navigation.goBack();
	};

	return (
		<ThemedView color="onSurface" style={styles.container}>
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
									onPress={(): void => handleTagChoose(tag)}
								/>
							))}
						</View>
					</>
				)}
				<Caption13Up color="gray1" style={styles.section}>
					NEW TAG
				</Caption13Up>
				<BottomSheetTextInput
					style={[
						styles.input,
						{
							backgroundColor: colors.white08,
							color: colors.text,
						},
					]}
					placeholder="Enter a new tag"
					blurOnSubmit={true}
					value={text}
					onChangeText={setText}
					onBlur={handleInputBlur}
					maxLength={15}
					returnKeyType="done"
				/>
			</View>
		</ThemedView>
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
	input: {
		padding: 16,
		borderRadius: 8,
		fontSize: 15,
		fontWeight: '600',
		minHeight: 70,
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

export default memo(AddressAndAmount);
