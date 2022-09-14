import React, { ReactElement, memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	BottomSheetTextInput,
	Caption13Up,
	TagIcon,
	View as ThemedView,
} from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import AmountToggle from '../../../components/AmountToggle';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
import Store from '../../../store/types';
import {
	updateInvoice,
	removeInvoiceTag,
} from '../../../store/actions/receive';
import useColors from '../../../hooks/colors';
import { toggleView } from '../../../store/actions/user';

const ReceiveDetails = ({ navigation }): ReactElement => {
	const insets = useSafeAreaInsets();
	const invoice = useSelector((store: Store) => store.receive);
	const numberPadReceiveIsOpen = useSelector(
		(store: Store) => store.user.viewController?.numberPadReceive.isOpen,
	);
	const colors = useColors();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const onTogglePress = useCallback(() => {
		Keyboard.dismiss(); // in case it was opened by Address input
		toggleView({
			view: 'numberPadReceive',
			data: {
				isOpen: true,
				snapPoint: 0,
			},
		});
	}, []);

	const handleTagRemove = useCallback((tag: string) => {
		removeInvoiceTag({ tag });
	}, []);

	const closeNumberPad = useCallback(() => {
		if (numberPadReceiveIsOpen) {
			toggleView({
				view: 'numberPadReceive',
				data: {
					isOpen: false,
					snapPoint: 0,
				},
			});
		}
	}, [numberPadReceiveIsOpen]);

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<BottomSheetNavigationHeader
				title="Specify Invoice"
				displayBackButton={false}
			/>
			<View style={styles.content}>
				<AmountToggle
					sats={invoice.amount}
					onPress={onTogglePress}
					style={styles.amountToggle}
					reverse={true}
					space={16}
				/>
				<Caption13Up color="gray1" style={styles.section}>
					NOTE
				</Caption13Up>
				<View style={styles.inputWrapper}>
					<BottomSheetTextInput
						style={[
							styles.input,
							{
								backgroundColor: colors.white08,
								color: colors.text,
							},
						]}
						onFocus={closeNumberPad}
						selectTextOnFocus={true}
						multiline={true}
						placeholder="Optional note to payer"
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={(txt): void => {
							updateInvoice({ message: txt });
						}}
						value={invoice.message}
						blurOnSubmit={true}
					/>
				</View>
				<Caption13Up color="gray1" style={styles.section}>
					TAGS
				</Caption13Up>
				<View style={styles.tagsContainer}>
					{invoice?.tags?.map((tag) => (
						<Tag
							key={tag}
							value={tag}
							onClose={(): void => handleTagRemove(tag)}
							style={styles.tag}
						/>
					))}
				</View>
				<View style={styles.tagsContainer}>
					<Button
						style={styles.button}
						text="Add Tag"
						icon={<TagIcon color="brand" width={16} />}
						onPress={(): void => {
							closeNumberPad();
							Keyboard.dismiss();
							navigation.navigate('Tags');
						}}
					/>
				</View>
				<View style={buttonContainerStyles}>
					<Button
						size="lg"
						text="Show QR Code"
						onPress={(): void => navigation.navigate('Receive')}
					/>
				</View>
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
	amountToggle: {
		marginBottom: 32,
	},
	section: {
		marginBottom: 8,
	},
	inputWrapper: {
		marginBottom: 16,
		position: 'relative',
	},
	input: {
		padding: 16,
		paddingTop: 16,
		paddingRight: 130,
		borderRadius: 8,
		fontSize: 15,
		fontWeight: '600',
		minHeight: 70,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 8,
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
	button: {
		marginRight: 8,
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ReceiveDetails);
