import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useEffect,
} from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	BottomSheetTextInput,
	Caption13Up,
	TagIcon,
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
import useKeyboard from '../../../hooks/keyboard';
import { toggleView } from '../../../store/actions/user';
import GradientView from '../../../components/GradientView';

const ReceiveDetails = ({ navigation }): ReactElement => {
	const insets = useSafeAreaInsets();
	const invoice = useSelector((store: Store) => store.receive);
	const { keyboardShown } = useKeyboard();
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

	// Close NumberPad on unmount
	useEffect(() => {
		return () => {
			closeNumberPad();
		};
	}, []);

	const closeNumberPad = (): void => {
		toggleView({
			view: 'numberPadReceive',
			data: {
				isOpen: false,
				snapPoint: 0,
			},
		});
	};

	return (
		<GradientView style={styles.container}>
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
						style={styles.input}
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
						color="white04"
						text="Add Tag"
						icon={<TagIcon color="brand" width={16} />}
						onPress={(): void => {
							closeNumberPad();
							Keyboard.dismiss();
							navigation.navigate('Tags');
						}}
					/>
				</View>
				{!keyboardShown && (
					<View style={buttonContainerStyles}>
						<Button
							size="large"
							text="Show QR Code"
							onPress={(): void => navigation.navigate('Receive')}
						/>
					</View>
				)}
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
		minHeight: 74,
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
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ReceiveDetails);
