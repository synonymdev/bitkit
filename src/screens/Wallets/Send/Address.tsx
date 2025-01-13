import React, { ReactElement, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import useColors from '../../../hooks/colors';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import type { SendScreenProps } from '../../../navigation/types';
import {
	BottomSheetTextInput,
	View as ThemedView,
} from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import { processUri } from '../../../utils/scanner/scanner';

type TValidation = {
	[x: string]: boolean;
};

const Address = ({ route }: SendScreenProps<'Address'>): ReactElement => {
	const uri = route.params?.uri ?? '';
	const colors = useColors();
	const { t } = useTranslation('wallet');
	const { keyboardShown } = useKeyboard();
	const [textFieldValue, setTextFieldValue] = useState(uri);
	// if a URI is passed in, we assume it's valid
	const [isValid, setIsValid] = useState<TValidation>({ [uri]: !!uri });

	const onChangeText = async (text: string): Promise<void> => {
		const diff = Math.abs(text.length - textFieldValue.length);
		const hasPasted = diff > 1;

		setTextFieldValue(text);

		const result = await processUri({
			uri: text,
			source: 'send',
			showErrors: hasPasted,
			validateOnly: true,
		});

		setIsValid((s) => ({ ...s, [text]: !result.isErr() }));
	};

	const onContinue = async (): Promise<void> => {
		await Keyboard.dismiss();
		await processUri({ uri: textFieldValue, source: 'send' });
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('send_bitcoin')} />
			<View style={styles.content}>
				<Caption13Up color="secondary" style={styles.label} testID="Caption">
					{t('send_to')}
				</Caption13Up>

				<ThemedView
					style={[styles.inputWrapper, keyboardShown && styles.inputKeyboard]}
					color="white06">
					<BottomSheetTextInput
						style={styles.input}
						value={textFieldValue}
						selectionColor={colors.brand}
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
						disabled={!isValid[textFieldValue]}
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
