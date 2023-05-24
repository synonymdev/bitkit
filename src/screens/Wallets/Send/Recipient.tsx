import React, { ReactElement, memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';

import {
	View as ThemedView,
	AnimatedView,
	BottomSheetTextInput,
} from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import { ClipboardTextIcon, ScanIcon, UserIcon } from '../../../styles/icons';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import ContactSmall from '../../../components/ContactSmall';
import IconButton from '../../../components/IconButton';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { processInputData, validateInputData } from '../../../utils/scanner';
import { showErrorNotification } from '../../../utils/notifications';
import useColors from '../../../hooks/colors';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import type { SendScreenProps } from '../../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../../store/actions/wallet';

const imageSrc = require('../../../assets/illustrations/coin-stack-logo.png');

const Recipient = ({
	navigation,
}: SendScreenProps<'Recipient'>): ReactElement => {
	const colors = useColors();
	const sdk = useSlashtagsSDK();
	const { t } = useTranslation('wallet');
	const { keyboardShown } = useKeyboard();
	const [textFieldValue, setTextFieldValue] = useState('');
	const [isValid, setIsValid] = useState(false);
	const transaction = useSelector(transactionSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	useBottomSheetBackPress('sendNavigation');

	const onChangeText = async (text?: string): Promise<void> => {
		let _isValid = false;
		let usedPasteButton = false;

		// user pressed clipboard button
		if (text === undefined) {
			usedPasteButton = true;
			text = await Clipboard.getString();
			text = text.trim();

			if (!text) {
				showErrorNotification({
					title: t('send_clipboard_empty_title'),
					message: t('send_clipboard_empty_text'),
				});
				return;
			}
		}

		setTextFieldValue(text);

		const decodeRes = await validateInputData({
			data: text,
			source: 'send',
			sdk,
			showErrors: usedPasteButton,
		});
		if (decodeRes.isErr()) {
			_isValid = false;
		} else {
			_isValid = true;
			if (usedPasteButton) {
				// parse data, update transaction and navigate to next screen
				await processInputData({
					data: text,
					source: 'send',
					sdk,
					selectedNetwork,
					selectedWallet,
				});
			}
		}

		setIsValid(_isValid);
	};

	const onOpenScanner = (): void => {
		navigation.navigate('Scanner');
	};

	const onSendToContact = (): void => {
		navigation.navigate('Contacts');
	};

	const onRemoveContact = async (): Promise<void> => {
		setTextFieldValue('');
		setIsValid(false);
		resetSendTransaction({ selectedWallet, selectedNetwork });
		await setupOnChainTransaction({ selectedNetwork, selectedWallet });
	};

	const onContinue = async (): Promise<void> => {
		await Keyboard.dismiss();

		// make sure transaction is up-to-date when navigating back and forth
		await processInputData({
			data: textFieldValue,
			source: 'send',
			showErrors: false,
			sdk,
			selectedNetwork,
			selectedWallet,
		});

		if (transaction.lightningInvoice && transaction.outputs[0].value > 0) {
			navigation.navigate('ReviewAndSend');
		} else {
			navigation.navigate('Amount');
		}
	};

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('send_bitcoin')}
				displayBackButton={false}
			/>
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.label} testID="Caption">
					{t('send_to')}
				</Caption13Up>

				<ThemedView
					style={[styles.inputWrapper, keyboardShown && styles.inputKeyboard]}
					color="white04">
					{transaction.slashTagsUrl ? (
						<ContactSmall
							style={styles.contact}
							url={transaction.slashTagsUrl}
							onDelete={onRemoveContact}
						/>
					) : (
						<BottomSheetTextInput
							style={styles.input}
							value={textFieldValue}
							selectionColor={colors.brand}
							placeholderTextColor={colors.white5}
							selectTextOnFocus={true}
							multiline={true}
							placeholder={t('send_address_placeholder')}
							autoCapitalize="none"
							autoCorrect={false}
							blurOnSubmit={true}
							returnKeyType="done"
							onChangeText={onChangeText}
							testID="RecipientInput"
						/>
					)}

					<View style={styles.inputActions}>
						<IconButton style={styles.inputAction} onPress={onOpenScanner}>
							<ScanIcon color="brand" width={24} />
						</IconButton>
						<IconButton
							style={styles.inputAction}
							onPress={(): void => {
								onChangeText().then();
							}}>
							<ClipboardTextIcon color="brand" width={24} />
						</IconButton>
						<IconButton style={styles.inputAction} onPress={onSendToContact}>
							<UserIcon color="brand" width={24} />
						</IconButton>
					</View>
				</ThemedView>

				<View style={[styles.bottom, keyboardShown && styles.bottomKeyboard]}>
					{!keyboardShown && (
						<AnimatedView
							style={styles.image}
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<GlowImage image={imageSrc} glowColor="white3" />
						</AnimatedView>
					)}

					<Button
						text={t('continue')}
						size="large"
						disabled={!isValid && !transaction.slashTagsUrl}
						testID="ContinueRecipient"
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
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
		marginBottom: 16,
	},
	inputKeyboard: {
		flex: 1,
		marginBottom: 16,
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
	inputAction: {
		marginLeft: 16,
	},
	contact: {
		margin: 16,
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
	image: {
		flex: 1,
		zIndex: -1,
	},
});

export default memo(Recipient);
