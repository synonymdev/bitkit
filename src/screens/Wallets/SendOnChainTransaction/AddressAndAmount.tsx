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
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import {
	ScanIcon,
	Caption13Up,
	ClipboardTextIcon,
	UserIcon,
	TagIcon,
	View as ThemedView,
} from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import AmountToggle from '../../../components/AmountToggle';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
import OnChainNumberPad from '../SendOnChainTransaction/OnChainNumberPad';
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
import useColors from '../../../hooks/colors';
import { updateOnchainFeeEstimates } from '../../../store/actions/fees';
import { toggleView } from '../../../store/actions/user';
import {
	decodeLightningInvoice,
	milliSatoshisToSatoshis,
} from '../../../utils/lightning';
import { TInvoice } from '@synonymdev/react-native-ldk';
import { processInputData } from '../../../utils/scanner';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';

const AddressAndAmount = ({ index = 0, navigation }): ReactElement => {
	useBottomSheetBackPress('sendNavigation');

	const insets = useSafeAreaInsets();
	const colors = useColors();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 10,
		}),
		[insets.bottom],
	);
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const initial = useSelector(
		(store: Store) => store.user.viewController?.sendNavigation?.initial,
	);
	const coinSelectAuto = useSelector(
		(state: Store) => state.settings.coinSelectAuto,
	);

	const [decodedInvoice, setDecodedInvoice] = useState<undefined | TInvoice>(
		undefined,
	);
	const transaction = useTransactionDetails();
	const displayBackButton = initial === 'SendAssetPickerList';

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
	const getOutput = useMemo((): IOutput | undefined => {
		try {
			return transaction.outputs?.[index];
		} catch {
			return { address: '', value: 0 };
		}
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
			decodedInvoice?.amount_milli_satoshis &&
			decodedInvoice?.amount_milli_satoshis > 0
		) {
			return milliSatoshisToSatoshis(decodedInvoice?.amount_milli_satoshis);
		}
		return 0;
	}, [decodedInvoice?.amount_milli_satoshis, lightningInvoice]);

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
			view: 'numberPad',
			data: {
				isOpen: true,
				snapPoint: 0,
			},
		});
	}, []);

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
		// try to update fees on this screen, because they will be used on next one
		updateOnchainFeeEstimates({ selectedNetwork }).then();
	}, [selectedNetwork]);

	const nextButtonIsDisabled = useCallback(() => {
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
			<NavigationHeader
				title="Send Bitcoin"
				displayBackButton={displayBackButton}
				size="sm"
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
						selectionColor={colors.brand}
						placeholderTextColor={colors.white5}
						selectTextOnFocus={true}
						multiline={true}
						placeholder="Paste or scan an address, invoice or select a contact"
						autoCapitalize="none"
						autoCorrect={false}
						onBlur={onBlur}
						onChangeText={onChangeText}
						value={lightningInvoice || address}
						blurOnSubmit={true}
					/>
					<View style={styles.inputActions}>
						<TouchableOpacity style={styles.inputAction} onPress={handleScan}>
							<ScanIcon color="brand" width={24} />
						</TouchableOpacity>
						<TouchableOpacity style={styles.inputAction} onPress={handlePaste}>
							<ClipboardTextIcon color="brand" width={24} />
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.inputAction}
							onPress={(): void => Alert.alert('TODO')}>
							<UserIcon color="brand" width={24} />
						</TouchableOpacity>
					</View>
				</View>
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
						style={styles.button}
						text="Add Tag"
						icon={<TagIcon color="brand" width={16} />}
						onPress={(): void => navigation.navigate('Tags')}
					/>
				</View>
				<View style={nextButtonContainer}>
					<Button
						size="lg"
						text="Next"
						disabled={nextButtonIsDisabled()}
						onPress={(): void => {
							let view = 'ReviewAndSend';
							// If coin select is enabled and there is no lightning invoice.
							if (coinSelectAuto && !transaction?.lightningInvoice) {
								view = 'CoinSelection';
							}
							navigation.navigate(view);
						}}
					/>
				</View>
			</View>
			<OnChainNumberPad />
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
		maxHeight: 100,
	},
	inputActions: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		right: 0,
		flexDirection: 'row',
		marginRight: 8,
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
	nextButtonContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		minHeight: 100,
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
	button: {
		marginRight: 8,
	},
});

export default memo(AddressAndAmount);
