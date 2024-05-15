import React, { ReactElement, memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
	BottomSheetTextInput,
	View as ThemedView,
} from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import Button from '../../../components/Button';
import GradientView from '../../../components/GradientView';
import SafeAreaInset from '../../../components/SafeAreaInset';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import { processInputData, validateInputData } from '../../../utils/scanner';
import useColors from '../../../hooks/colors';
import { useAppSelector } from '../../../hooks/redux';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import type { SendScreenProps } from '../../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const Address = ({}: SendScreenProps<'Address'>): ReactElement => {
	const colors = useColors();
	const { t } = useTranslation('wallet');
	const { keyboardShown } = useKeyboard();
	const [textFieldValue, setTextFieldValue] = useState('');
	const [isValid, setIsValid] = useState(false);
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);

	const onChangeText = async (text: string): Promise<void> => {
		const diff = Math.abs(text.length - textFieldValue.length);
		const hasPasted = diff > 1;

		setTextFieldValue(text);

		const result = await validateInputData({
			data: text,
			source: 'send',
			showErrors: hasPasted,
		});
		if (result.isErr()) {
			setIsValid(false);
		} else {
			setIsValid(true);
		}
	};

	const onContinue = async (): Promise<void> => {
		await Keyboard.dismiss();

		await processInputData({
			data: textFieldValue,
			source: 'send',
			selectedNetwork,
			selectedWallet,
		});
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('send_bitcoin')} />
			<View style={styles.content}>
				<Caption13Up color="white50" style={styles.label} testID="Caption">
					{t('send_to')}
				</Caption13Up>

				<ThemedView
					style={[styles.inputWrapper, keyboardShown && styles.inputKeyboard]}
					color="white06">
					<BottomSheetTextInput
						style={styles.input}
						value={textFieldValue}
						selectionColor={colors.brand}
						placeholderTextColor={colors.white50}
						selectTextOnFocus={true}
						multiline={true}
						placeholder={t('send_address_placeholder')}
						autoCapitalize="none"
						autoCorrect={false}
						blurOnSubmit={true}
						returnKeyType="done"
						testID="RecipientInput"
						onChangeText={onChangeText}
					/>
				</ThemedView>

				<View style={[styles.bottom, keyboardShown && styles.bottomKeyboard]}>
					<Button
						text={t('continue')}
						size="large"
						disabled={!isValid}
						testID="AddressContinue"
						onPress={onContinue}
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
	label: {
		marginBottom: 8,
	},
	inputWrapper: {
		flex: 1,
		justifyContent: 'space-between',
		position: 'relative',
		borderRadius: 8,
		padding: 8,
	},
	inputKeyboard: {
		flex: 1,
		marginBottom: 16,
	},
	input: {
		backgroundColor: 'transparent',
		fontSize: 22,
		flex: 1,
	},
	bottom: {
		position: 'relative',
		marginTop: 'auto',
		flex: 1,
		justifyContent: 'flex-end',
	},
	bottomKeyboard: {
		flex: 0,
	},
});

export default memo(Address);
