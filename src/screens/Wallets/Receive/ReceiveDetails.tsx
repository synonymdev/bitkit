import React, { ReactElement, memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, Image, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	BottomSheetTextInput,
	Caption13Up,
	TagIcon,
	View as ThemedView,
} from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import AmountToggle from '../../../components/AmountToggle';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
import Glow from '../../../components/Glow';
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
	const colors = useColors();
	const buttonContainer = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 10,
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

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<NavigationHeader
				title="Specify Invoice"
				size="sm"
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
								borderColor: colors.text,
							},
						]}
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
						onPress={(): void => navigation.navigate('Tags')}
					/>
				</View>
				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={300} color="white" />
					<Image
						style={styles.image}
						source={require('../../../assets/illustrations/coins.png')}
					/>
				</View>
				<View style={buttonContainer}>
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
		marginTop: 16,
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
	imageContainer: {
		position: 'absolute',
		bottom: 150,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		height: 200,
		width: 300,
		zIndex: -1,
	},
	glow: {
		position: 'absolute',
	},
	image: {
		height: 300,
		width: 300,
	},
	buttonContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		minHeight: 100,
	},
});

export default memo(ReceiveDetails);
