import React, { memo, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import {
	StyleSheet,
	View,
	ViewStyle,
	TextInputProps,
	StyleProp,
} from 'react-native';

import {
	BottomSheetTextInput,
	View as ThemedView,
} from '../../../styles/components';
import useColors from '../../../hooks/colors';
import ContactSmall from '../../../components/ContactSmall';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
} from '../../../store/actions/wallet';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

type Props = TextInputProps & {
	style: StyleProp<ViewStyle>;
	slashTagsUrl?: string;
};

const AddressOrSlashpay = ({
	children,
	style,
	slashTagsUrl,
	...props
}: Props): ReactElement => {
	const colors = useColors();
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const onRemoveContact = async (): Promise<void> => {
		resetOnChainTransaction({
			selectedWallet,
			selectedNetwork,
		});
		await setupOnChainTransaction({
			selectedNetwork,
			selectedWallet,
		});
	};

	if (slashTagsUrl) {
		return (
			<View style={[styles.root, style]}>
				<ThemedView style={styles.inputSlashtags} color="white08">
					<ContactSmall url={slashTagsUrl} onDelete={onRemoveContact} />
				</ThemedView>
				<View style={styles.inputActions}>{children}</View>
			</View>
		);
	}

	return (
		<View style={[styles.root, style]}>
			<BottomSheetTextInput
				style={styles.input}
				selectionColor={colors.brand}
				placeholderTextColor={colors.white5}
				minHeight={240}
				selectTextOnFocus={true}
				multiline={true}
				placeholder="Scan QR, paste invoice or select contact"
				autoCapitalize="none"
				autoCorrect={false}
				blurOnSubmit={true}
				returnKeyType="done"
				{...props}
			/>
			<View style={styles.inputActions}>{children}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		position: 'relative',
	},
	inputSlashtags: {
		padding: 16,
		borderRadius: 8,
		minHeight: 240,
	},
	input: {
		maxHeight: 240,
		paddingBottom: 80,
	},
	inputActions: {
		position: 'absolute',
		bottom: 16,
		right: 0,
		flexDirection: 'row',
		marginRight: 8,
	},
});

export default memo(AddressOrSlashpay);
