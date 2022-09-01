import React, { memo, ReactElement, useMemo, useState } from 'react';
import { Alert, StyleSheet, View, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { Subtitle, Text02S } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Store from '../../store/types';
import { toggleView } from '../../store/actions/user';
import Tag from '../../components/Tag';
import useColors from '../../hooks/colors';
import { addMetaTxTag } from '../../store/actions/metadata';
import { sleep } from '../../utils/helpers';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';

const Form = ({ id }: { id: string }): ReactElement => {
	const [text, setText] = useState('');
	const colors = useColors();
	const lastUsedTags = useSelector(
		(store: Store) => store.metadata.lastUsedTags,
	);

	const handleTagChoose = async (tag: string): Promise<void> => {
		const res = addMetaTxTag(id, tag);
		if (res.isErr()) {
			Alert.alert(res.error.message);
			return;
		}
		Keyboard.dismiss();
		await sleep(500); // await for keyboard to close
		toggleView({
			view: 'activityTagsPrompt',
			data: { isOpen: false },
		});
	};

	const handleInputBlur = async (): Promise<void> => {
		if (text.length === 0) {
			return;
		}
		const res = addMetaTxTag(id, text);
		if (res.isErr()) {
			Alert.alert(res.error.message);
			return;
		}
		await sleep(500); // await for keyboard to close
		toggleView({
			view: 'activityTagsPrompt',
			data: { isOpen: false },
		});
	};

	return (
		<>
			{lastUsedTags.length !== 0 && (
				<>
					<Text02S color="gray1">Previously used tags:</Text02S>
					<View style={styles.tagsContainer}>
						{lastUsedTags.map((tag) => (
							<Tag
								key={tag}
								value={tag}
								style={styles.tag}
								onPress={(): Promise<void> => handleTagChoose(tag)}
							/>
						))}
					</View>
				</>
			)}
			<BottomSheetTextInput
				style={[
					styles.input,
					{
						backgroundColor: colors.white08,
						color: colors.text,
						borderColor: colors.text,
					},
				]}
				selectionColor={colors.brand}
				placeholderTextColor={colors.white5}
				placeholder="Enter new tag"
				blurOnSubmit={true}
				value={text}
				onChangeText={setText}
				onBlur={handleInputBlur}
				autoFocus={true}
				maxLength={15}
				returnKeyType="done"
			/>
		</>
	);
};

const ActivityTagsPrompt = (): ReactElement => {
	const snapPoints = useMemo(() => [400], []);
	const isOpen = useSelector(
		(store: Store) => store.user.viewController?.activityTagsPrompt?.isOpen,
	);
	const id = useSelector(
		(store: Store) => store.user.viewController?.activityTagsPrompt?.id,
	);

	useBottomSheetBackPress('activityTagsPrompt');

	const handleClose = (): void => {
		toggleView({
			view: 'activityTagsPrompt',
			data: { isOpen: false },
		});
	};

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleClose}
			view="activityTagsPrompt">
			<View style={styles.root}>
				<Subtitle style={styles.title}>Add tag</Subtitle>

				{isOpen && id && <Form id={id} />}

				<SafeAreaInsets type="bottom" />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	title: {
		marginBottom: 25,
		textAlign: 'center',
	},
	input: {
		padding: 16,
		borderRadius: 8,
		fontSize: 15,
		minHeight: 70,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginVertical: 16,
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
});

export default memo(ActivityTagsPrompt);
