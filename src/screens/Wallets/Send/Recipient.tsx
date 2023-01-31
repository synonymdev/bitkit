import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import { validate } from 'bitcoin-address-validation';
import { TInvoice } from '@synonymdev/react-native-ldk';

import { AnimatedView } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import { ClipboardTextIcon, ScanIcon, UserIcon } from '../../../styles/icons';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import IconButton from '../../../components/IconButton';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { decodeLightningInvoice, refreshLdk } from '../../../utils/lightning';
import { validateSlashtagURL } from '../../../utils/slashtags';
import { processInputData } from '../../../utils/scanner';
import { sleep } from '../../../utils/helpers';
import { IBitcoinTransactionData, IOutput } from '../../../store/types/wallet';
import { updateBitcoinTransaction } from '../../../store/actions/wallet';
import { showErrorNotification } from '../../../utils/notifications';
import { updateOnchainFeeEstimates } from '../../../store/actions/fees';
import { viewControllerIsOpenSelector } from '../../../store/reselect/ui';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { useLightningBalance } from '../../../hooks/lightning';
import AddressOrSlashpay from './AddressOrSlashpay';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import type { SendScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/coin-stack-logo.png');

const Recipient = ({
	navigation,
}: SendScreenProps<'Recipient'>): ReactElement => {
	const sdk = useSlashtagsSDK();
	const insets = useSafeAreaInsets();
	const { keyboardShown } = useKeyboard();
	const lightningBalance = useLightningBalance(false);
	const [decodedInvoice, setDecodedInvoice] = useState<TInvoice>();
	const [handledOsPaste, setHandledOsPaste] = useState(false);
	const [showImage, setShowImage] = useState(true);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const transaction = useSelector(transactionSelector);
	const sendNavigationIsOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'sendNavigation'),
	);

	useBottomSheetBackPress('sendNavigation');

	const buttonContainerStyles = useMemo(
		() => ({
			// extra padding needed because of KeyboardAvoidingView
			paddingBottom: keyboardShown
				? Platform.OS === 'ios'
					? 16
					: 40
				: insets.bottom + 16,
		}),
		[keyboardShown, insets.bottom],
	);

	const getDecodeAndSetLightningInvoice =
		useCallback(async (): Promise<void> => {
			try {
				if (!transaction.lightningInvoice) {
					setDecodedInvoice(undefined);
					return;
				}
				const decodeInvoiceResponse = await decodeLightningInvoice({
					paymentRequest: transaction.lightningInvoice,
				});
				if (decodeInvoiceResponse.isErr()) {
					setDecodedInvoice(undefined);
					return;
				}
				setDecodedInvoice(decodeInvoiceResponse.value);
			} catch (e) {
				setDecodedInvoice(undefined);
				console.log(e);
			}
		}, [transaction.lightningInvoice]);

	useEffect(() => {
		if (!sendNavigationIsOpen) {
			return;
		}
		// Gives the modal animation time to start.
		sleep(50).then(() => {
			getDecodeAndSetLightningInvoice().then();
		});
	}, [
		getDecodeAndSetLightningInvoice,
		sendNavigationIsOpen,
		transaction.lightningInvoice,
	]);

	// TODO:
	const index = 0;

	/**
	 * Returns the current output by index.
	 */
	const getOutput = useMemo((): IOutput => {
		return transaction.outputs?.[index] ?? { address: '', value: 0, index: 0 };
	}, [index, transaction.outputs]);

	/**
	 * Returns the current address to send funds to.
	 */
	const address = useMemo((): string => {
		return getOutput.address ?? '';
	}, [getOutput.address]);

	// Holds decoded lightning invoice amount in satoshis
	const decodedInvoiceAmount = useMemo(() => {
		if (
			transaction.lightningInvoice &&
			decodedInvoice?.amount_satoshis &&
			decodedInvoice.amount_satoshis > 0
		) {
			return decodedInvoice.amount_satoshis;
		}
		return 0;
	}, [decodedInvoice?.amount_satoshis, transaction.lightningInvoice]);

	/**
	 * Returns the value of the current output.
	 */
	const value = useMemo((): number => {
		return transaction.lightningInvoice
			? decodedInvoiceAmount
			: getOutput.value ?? 0;
	}, [decodedInvoiceAmount, getOutput.value, transaction.lightningInvoice]);

	useEffect(() => {
		if (!sendNavigationIsOpen) {
			return;
		}
		// Gives the modal animation time to start.
		sleep(50).then(() => {
			// try to update fees on this screen, because they will be used on next one
			updateOnchainFeeEstimates({ selectedNetwork, forceUpdate: true }).then();

			if (lightningBalance.localBalance > 0) {
				refreshLdk({ selectedWallet, selectedNetwork }).then();
			}
		});
	}, [
		sendNavigationIsOpen,
		lightningBalance.localBalance,
		selectedNetwork,
		selectedWallet,
	]);

	useEffect(() => {
		if (keyboardShown) {
			setShowImage(false);
		} else {
			setShowImage(true);
		}
	}, [keyboardShown]);

	const handleScan = (): void => {
		navigation.navigate('Scanner');
	};

	const handleSendToContact = (): void => {
		navigation.navigate('Contacts');
	};

	const onContinue = async (): Promise<void> => {
		await Keyboard.dismiss();
		if (transaction.lightningInvoice && decodedInvoiceAmount > 0) {
			navigation.navigate('ReviewAndSend');
		} else {
			navigation.navigate('Amount');
		}
	};

	const handlePaste = useCallback(
		async (txt: string) => {
			let clipboardData = txt;
			if (!clipboardData) {
				clipboardData = await Clipboard.getString();
			}
			if (!clipboardData) {
				showErrorNotification({
					title: 'Clipboard is empty',
					message: 'No address data available.',
				});
				return;
			}
			await Keyboard.dismiss();
			const result = await processInputData({
				data: clipboardData,
				source: 'sendScanner',
				sdk,
				selectedNetwork,
				selectedWallet,
			});
			if (result.isErr()) {
				// Even though we're not able to interpret the data, pass it to the text input for editing.
				updateBitcoinTransaction({
					selectedWallet,
					selectedNetwork,
					transaction: {
						outputs: [{ address: clipboardData, value, index }],
					},
				}).then();
			}
		},
		[index, value, selectedNetwork, selectedWallet, sdk],
	);

	const onFocus = useCallback((): void => {
		setShowImage(false);
	}, []);

	const onBlur = useCallback(async (): Promise<void> => {
		setShowImage(true);

		//An OS Paste was triggered. No need to process onBlur data.
		if (handledOsPaste) {
			return;
		}
		const tAddress = address.trim();
		// check if it is a slashtag url and try to get address from it
		if (validateSlashtagURL(tAddress)) {
			await processInputData({
				data: tAddress,
				source: 'sendScanner',
				sdk,
				selectedNetwork,
				selectedWallet,
			});
			return;
		}

		// Continue updating the on-chain information as we would previously.
		const tx: IBitcoinTransactionData = {
			outputs: [{ address: tAddress, value, index }],
			lightningInvoice: '',
		};
		// Attempt to decode what may be a lightning invoice.
		const decodeInvoiceResponse = await decodeLightningInvoice({
			paymentRequest: tAddress,
		});
		// Set lightning invoice if successfully decoded.
		if (decodeInvoiceResponse.isOk()) {
			tx.lightningInvoice = tAddress;
		}
		updateBitcoinTransaction({
			selectedWallet,
			selectedNetwork,
			transaction: tx,
		}).then();
	}, [
		handledOsPaste,
		address,
		value,
		index,
		selectedWallet,
		selectedNetwork,
		sdk,
	]);

	const onChangeText = useCallback(
		(txt: string) => {
			const includesKeyword =
				txt.includes(':') ||
				txt.includes('?') ||
				txt.includes('bitcoin') ||
				txt.includes('lightning');
			// Workaround for capturing an invoice from a potential OS paste.
			if (!handledOsPaste && includesKeyword) {
				handlePaste(txt).then();
				setHandledOsPaste(true);
				return;
			} else if (handledOsPaste && includesKeyword) {
				setHandledOsPaste(false);
			}

			updateBitcoinTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: {
					outputs: [{ address: txt, value, index }],
					lightningInvoice: '',
				},
			}).then();
		},
		[
			handlePaste,
			handledOsPaste,
			index,
			selectedNetwork,
			selectedWallet,
			value,
		],
	);

	const isInvalid = useCallback(() => {
		// no valid address or lightning invoice
		if (!validate(address) && !transaction.lightningInvoice) {
			return true;
		}
		return false;
	}, [address, transaction.lightningInvoice]);

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title="Send Bitcoin"
				displayBackButton={false}
			/>
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.label}>
					To
				</Caption13Up>

				<AddressOrSlashpay
					style={[styles.input, !showImage && styles.inputKeyboard]}
					value={transaction.lightningInvoice || address}
					slashTagsUrl={transaction.slashTagsUrl}
					onChangeText={onChangeText}
					onFocus={onFocus}
					onBlur={onBlur}>
					<IconButton style={styles.inputAction} onPress={handleScan}>
						<ScanIcon color="brand" width={24} />
					</IconButton>
					<IconButton
						style={styles.inputAction}
						onPress={(): void => {
							handlePaste('').then();
						}}>
						<ClipboardTextIcon color="brand" width={24} />
					</IconButton>
					<IconButton style={styles.inputAction} onPress={handleSendToContact}>
						<UserIcon color="brand" width={24} />
					</IconButton>
				</AddressOrSlashpay>

				<View style={[styles.bottom, !showImage && styles.bottomKeyboard]}>
					{!keyboardShown && showImage && (
						<AnimatedView
							style={styles.image}
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<GlowImage image={imageSrc} glowColor="white3" />
						</AnimatedView>
					)}

					<View style={buttonContainerStyles}>
						<Button
							text="Continue"
							size="large"
							disabled={isInvalid()}
							onPress={onContinue}
						/>
					</View>
				</View>
			</View>
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
	input: {
		marginBottom: 16,
	},
	inputKeyboard: {
		flex: 1,
		marginBottom: 16,
	},
	inputAction: {
		marginLeft: 16,
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
