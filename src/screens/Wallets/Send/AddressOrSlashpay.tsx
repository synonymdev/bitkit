import React, { memo, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import {
	StyleSheet,
	View,
	ViewStyle,
	TextInputProps,
	StyleProp,
} from 'react-native';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation('wallet');
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
			<ThemedView style={styles.inputWrapper} color="white04">
				<BottomSheetTextInput
					style={styles.input}
					selectionColor={colors.brand}
					placeholderTextColor={colors.white5}
					selectTextOnFocus={true}
					multiline={true}
					placeholder={t('send_address_placeholder')}
					autoCapitalize="none"
					autoCorrect={false}
					blurOnSubmit={true}
					returnKeyType="done"
					{...props}
				/>
				<View style={styles.inputActions}>{children}</View>
			</ThemedView>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		position: 'relative',
		flex: 1,
	},
	inputSlashtags: {
		padding: 16,
		borderRadius: 8,
		minHeight: 240,
	},
	inputWrapper: {
		flex: 1,
		justifyContent: 'space-between',
		borderRadius: 8,
	},
	input: {
		backgroundColor: 'transparent',
		flex: 1,
	},
	inputActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		padding: 16,
	},
});

export default memo(AddressOrSlashpay);
