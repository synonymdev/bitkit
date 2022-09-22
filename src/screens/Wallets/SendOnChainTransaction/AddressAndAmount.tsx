import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	StyleSheet,
	View,
	Alert,
	TouchableOpacity,
	Keyboard,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import { validate } from 'bitcoin-address-validation';

import {
	Caption13Up,
	ClipboardTextIcon,
	ScanIcon,
	TagIcon,
	UserIcon,
	View as ThemedView,
} from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import AmountToggle from '../../../components/AmountToggle';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
import Store from '../../../store/types';
import { ETransactionDefaults, IOutput } from '../../../store/types/wallet';
import { getTransactionOutputValue } from '../../../utils/wallet/transactions';
import {
	removeTxTag,
	updateBitcoinTransaction,
} from '../../../store/actions/wallet';
import {
	showErrorNotification,
	showInfoNotification,
} from '../../../utils/notifications';
import { useTransactionDetails } from '../../../hooks/transaction';
import { updateOnchainFeeEstimates } from '../../../store/actions/fees';
import { toggleView } from '../../../store/actions/user';
import { decodeLightningInvoice, refreshLdk } from '../../../utils/lightning';
import { TInvoice } from '@synonymdev/react-native-ldk';
import { processInputData } from '../../../utils/scanner';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import useKeyboard from '../../../hooks/keyboard';
import AddressOrSlashpay from './AddressOrSlashpay';

const AddressAndAmount = ({ index = 0, navigation }): ReactElement => {
	useBottomSheetBackPress('sendNavigation');
	const { keyboardShown } = useKeyboard();
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const numberPadIsOpen = useSelector(
		(store: Store) => store.user.viewController?.numberPadSend.isOpen,
	);
	const coinSelectAuto = useSelector(
		(state: Store) => state.settings.coinSelectAuto,
	);
	const sendNavigationIsOpen = useSelector(
		(store: Store) => store.user.viewController.sendNavigation.isOpen,
	);

	const [decodedInvoice, setDecodedInvoice] = useState<undefined | TInvoice>(
		undefined,
	);
	const transaction = useTransactionDetails();

	const getDecodeAndSetLightningInvoice = async (): Promise<void> => {
		try {
			if (!transaction?.lightningInvoice) {
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
	};

	useEffect(() => {
		getDecodeAndSetLightningInvoice().then();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.lightningInvoice]);

	/*
	 * Total value of all outputs. Excludes change address.
	 */
	const amount = useMemo((): number => {
		try {
			return getTransactionOutputValue({
				selectedWallet,
				selectedNetwork,
			});
		} catch {
			return 0;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction?.outputs, selectedNetwork, selectedWallet]);

	/**
	 * Returns the current output by index.
	 */
	const getOutput = useMemo((): IOutput => {
		return transaction.outputs?.[index] ?? { address: '', value: 0, index: 0 };
	}, [index, transaction?.outputs]);

	/**
	 * Returns the current address to send funds to.
	 */
	const address = useMemo((): string => {
		try {
			return getOutput?.address || '';
		} catch (e) {
			console.log(e);
			return '';
		}
	}, [getOutput?.address]);

	/**
	 * Returns the current lightningInvoice.
	 */
	const lightningInvoice = useMemo((): string => {
		try {
			return transaction?.lightningInvoice || '';
		} catch (e) {
			console.log(e);
			return '';
		}
	}, [transaction?.lightningInvoice]);

	// Holds decoded lightning invoice amount in satoshis
	const decodedInvoiceAmount = useMemo(() => {
		if (
			lightningInvoice &&
			decodedInvoice?.amount_satoshis &&
			decodedInvoice?.amount_satoshis > 0
		) {
			return decodedInvoice?.amount_satoshis;
		}
		return 0;
	}, [decodedInvoice?.amount_satoshis, lightningInvoice]);

	/**
	 * Returns the value of the current output.
	 */
	const value = useMemo((): number => {
		try {
			return lightningInvoice ? decodedInvoiceAmount : getOutput?.value ?? 0;
		} catch (e) {
			return 0;
		}
	}, [decodedInvoiceAmount, getOutput?.value, lightningInvoice]);

	const handlePaste = useCallback(async () => {
		const clipboardData = await Clipboard.getString();
		if (!clipboardData) {
			showErrorNotification({
				title: 'Clipboard is empty',
				message: 'No address data available.',
			});
			return;
		}
		// remove slashtagsurl on paste
		await updateBitcoinTransaction({
			selectedWallet,
			selectedNetwork,
			transaction: {
				slashTagsUrl: undefined,
			},
		});
		const result = await processInputData({
			data: clipboardData,
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
	}, [index, selectedNetwork, selectedWallet, value]);

	const handleScan = useCallback(async () => {
		navigation.navigate('Scanner');
	}, [navigation]);

	const handleSendToContact = useCallback(async () => {
		navigation.navigate('Contacts');
	}, [navigation]);

	const handleTagRemove = useCallback(
		(tag) => {
			const res = removeTxTag({ tag, selectedNetwork, selectedWallet });
			if (res.isErr()) {
				return Alert.alert(res.error.message);
			}
		},
		[selectedWallet, selectedNetwork],
	);

	const onTogglePress = useCallback(() => {
		Keyboard.dismiss(); // in case it was opened by Address input
		toggleView({
			view: 'numberPadSend',
			data: {
				isOpen: true,
				snapPoint: 0,
			},
		});
	}, []);

	const closeNumberPad = useCallback(() => {
		if (numberPadIsOpen) {
			toggleView({
				view: 'numberPadSend',
				data: {
					isOpen: false,
					snapPoint: 0,
				},
			});
		}
	}, [numberPadIsOpen]);

	const onBlur = useCallback(async (): Promise<void> => {
		// Continue updating the on-chain information as we would previously.
		let tx = {
			outputs: [{ address, value, index }],
			lightningInvoice: '',
		};
		// Attempt to decode what may be a lightning invoice.
		const decodeInvoiceResponse = await decodeLightningInvoice({
			paymentRequest: address,
		});
		// Set lightning invoice if successfully decoded.
		if (decodeInvoiceResponse.isOk()) {
			tx.lightningInvoice = address;
		}
		updateBitcoinTransaction({
			selectedWallet,
			selectedNetwork,
			transaction: tx,
		}).then();
	}, [address, index, selectedNetwork, selectedWallet, value]);

	const onChangeText = useCallback(
		(txt: string) => {
			updateBitcoinTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: {
					outputs: [{ address: txt, value, index }],
					lightningInvoice: '',
				},
			}).then();
		},
		[index, selectedNetwork, selectedWallet, value],
	);

	useEffect(() => {
		if (sendNavigationIsOpen) {
			// try to update fees on this screen, because they will be used on next one
			updateOnchainFeeEstimates({ selectedNetwork }).then();
			refreshLdk({ selectedWallet, selectedNetwork }).then();
		}
	}, [selectedNetwork, selectedWallet, sendNavigationIsOpen]);

	const isInvalid = useCallback(() => {
		if (
			validate(address) &&
			amount <= ETransactionDefaults.recommendedBaseFee
		) {
			return true;
		}
		return !validate(address) && !transaction?.lightningInvoice;
	}, [address, amount, transaction?.lightningInvoice]);

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<BottomSheetNavigationHeader
				title="Send Bitcoin"
				displayBackButton={false}
			/>
			<View style={styles.content}>
				<AmountToggle
					sats={amount}
					onPress={(): void => {
						// If the decoded invoice amount is set to anything greater than 0 we are not able to adjust the amount.
						if (lightningInvoice && decodedInvoiceAmount > 0) {
							showInfoNotification({
								title: 'Unable To Update Amount',
								message: `The invoice requires that ${amount} sats be paid`,
							});
							return;
						}
						onTogglePress();
					}}
					style={styles.amountToggle}
					reverse={true}
					space={16}
				/>
				<Caption13Up color="gray1" style={styles.section}>
					TO
				</Caption13Up>
				<AddressOrSlashpay
					style={styles.inputWrapper}
					slashTagsUrl={transaction?.slashTagsUrl}
					onBlur={onBlur}
					onChangeText={onChangeText}
					onFocus={closeNumberPad}
					value={lightningInvoice || address}>
					<TouchableOpacity style={styles.inputAction} onPress={handleScan}>
						<ScanIcon color="brand" width={24} />
					</TouchableOpacity>
					<TouchableOpacity style={styles.inputAction} onPress={handlePaste}>
						<ClipboardTextIcon color="brand" width={24} />
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.inputAction}
						onPress={handleSendToContact}>
						<UserIcon color="brand" width={24} />
					</TouchableOpacity>
				</AddressOrSlashpay>
				<Caption13Up color="gray1" style={styles.section}>
					TAGS
				</Caption13Up>
				<View style={styles.tagsContainer}>
					{transaction?.tags?.map((tag) => (
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
				<View style={buttonContainerStyles}>
					{!keyboardShown && !isInvalid() && (
						<Button
							size="large"
							text="Next"
							onPress={(): void => {
								let view = 'ReviewAndSend';
								// If auto coin-select is disabled and there is no lightning invoice.
								if (!coinSelectAuto && !transaction?.lightningInvoice) {
									view = 'CoinSelection';
								}
								navigation.navigate(view);
							}}
						/>
					)}
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
	},
	inputAction: {
		paddingHorizontal: 8,
		justifyContent: 'center',
		alignItems: 'center',
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

export default memo(AddressAndAmount);
