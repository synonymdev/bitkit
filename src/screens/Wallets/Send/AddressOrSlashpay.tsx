import React, { memo, ReactElement } from 'react';
import { StyleSheet, View, ViewStyle, TextInputProps } from 'react-native';

import {
	BottomSheetTextInput,
	View as ThemedView,
} from '../../../styles/components';
import useColors from '../../../hooks/colors';
import ContactSmall from '../../../components/ContactSmall';

type Props = TextInputProps & {
	children: ReactElement | ReactElement[];
	style: ViewStyle;
	slashTagsUrl?: string;
};

const AddressOrSlashpay = ({
	children,
	style,
	slashTagsUrl,
	...props
}: Props): ReactElement => {
	const colors = useColors();

	if (slashTagsUrl) {
		return (
			<View style={[styles.root, style]}>
				<ThemedView
					color="white08"
					style={[styles.input, styles.inputSlashtags]}>
					<ContactSmall url={slashTagsUrl} />
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
				selectTextOnFocus={true}
				multiline={true}
				placeholder="Paste or scan an address, invoice or select a contact"
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
	input: {
		paddingRight: 140,
		maxHeight: 100,
	},
	inputSlashtags: {
		padding: 16,
		borderRadius: 8,
		minHeight: 70,
	},
	inputActions: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		right: 0,
		flexDirection: 'row',
		marginRight: 8,
	},
});

export default memo(AddressOrSlashpay);
