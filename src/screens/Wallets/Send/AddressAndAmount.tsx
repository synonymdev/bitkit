import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import { validate } from 'bitcoin-address-validation';
import { TInvoice } from '@synonymdev/react-native-ldk';

import { AnimatedView } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import {
	ClipboardTextIcon,
	ScanIcon,
	TagIcon,
	UserIcon,
} from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import AmountToggle from '../../../components/AmountToggle';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
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
import { decodeLightningInvoice, refreshLdk } from '../../../utils/lightning';
import { processInputData } from '../../../utils/scanner';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import useKeyboard from '../../../hooks/keyboard';
import { validateSlashtagURL } from '../../../utils/slashtags';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import AddressOrSlashpay from './AddressOrSlashpay';
import SendNumberPad from './SendNumberPad';
import type { SendScreenProps } from '../../../navigation/types';
import type { SendStackParamList } from '../../../navigation/bottom-sheet/SendNavigation';
import { useBalance } from '../../../hooks/wallet';
import Money from '../../../components/Money';
import { useLightningBalance } from '../../../hooks/lightning';
import { sleep } from '../../../utils/helpers';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { viewControllerIsOpenSelector } from '../../../store/reselect/ui';
import {
	coinSelectAutoSelector,
	unitPreferenceSelector,
} from '../../../store/reselect/settings';

const AddressAndAmount = ({
	navigation,
}: SendScreenProps<'AddressAndAmount'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const { keyboardShown } = useKeyboard();
	const [showNumberPad, setShowNumberPad] = useState(false);

	const onChainBalance = useBalance({ onchain: true });
	const lightningBalance = useLightningBalance(false);

	useBottomSheetBackPress('sendNavigation');

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const coinSelectAuto = useSelector(coinSelectAutoSelector);
	const sendNavigationIsOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'sendNavigation'),
	);
	const unitPreference = useSelector(unitPreferenceSelector);

	const [decodedInvoice, setDecodedInvoice] = useState<TInvoice>();
	const [handledOsPaste, setHandledOsPaste] = useState(false);
	const transaction = useTransactionDetails();
	const sdk = useSlashtagsSDK();

	const getDecodeAndSetLightningInvoice =
		useCallback(async (): Promise<void> => {
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

	// TODO:
	const index = 0;

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

	const handlePaste = useCallback(
		async (txt) => {
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
			console.log({ clipboardData });
			const result = await processInputData({
				data: clipboardData,
				source: 'sendScanner',
				sdk,
				selectedNetwork,
				selectedWallet,
			});
			console.log({ result });
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

	const handleScan = (): void => {
		navigation.navigate('Scanner');
	};

	const handleSendToContact = (): void => {
		navigation.navigate('Contacts');
	};

	const handleTagRemove = useCallback(
		(tag) => {
			const res = removeTxTag({ tag, selectedNetwork, selectedWallet });
			if (res.isErr()) {
				showErrorNotification({
					title: 'Error Removing Tag',
					message: res.error.message,
				});
			}
		},
		[selectedWallet, selectedNetwork],
	);

	const onTogglePress = useCallback(() => {
		Keyboard.dismiss(); // in case it was opened by Address input
		setShowNumberPad(true);
	}, []);

	const closeNumberPad = useCallback(() => {
		setShowNumberPad(false);
	}, []);

	const onBlur = useCallback(async (): Promise<void> => {
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
		const tx = {
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

	const isInvalid = useCallback(() => {
		if (
			validate(address) &&
			amount <= ETransactionDefaults.recommendedBaseFee
		) {
			return true;
		}
		return !validate(address) && !transaction?.lightningInvoice;
	}, [address, amount, transaction?.lightningInvoice]);

	/**
	 * Returns available amount to spend for either onchain or lightning.
	 */
	const availableAmount = useMemo(() => {
		if (transaction.lightningInvoice) {
			return lightningBalance.localBalance;
		}
		if (
			(transaction?.outputs &&
				transaction.outputs.length > 0 &&
				transaction.outputs[0].address) ||
			showNumberPad
		) {
			if (onChainBalance.satoshis <= ETransactionDefaults.recommendedBaseFee) {
				return 0;
			}
			return onChainBalance.satoshis - ETransactionDefaults.recommendedBaseFee;
		}
		return 0;
	}, [
		lightningBalance.localBalance,
		onChainBalance.satoshis,
		showNumberPad,
		transaction.lightningInvoice,
		transaction.outputs,
	]);

	const availableAmountProps = useMemo(() => {
		return {
			...(unitPreference !== 'fiat' ? { symbol: true } : { showFiat: true }),
		};
	}, [unitPreference]);

	return (
		<View style={styles.container}>
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

				{showNumberPad && (
					<View style={styles.availableAmount}>
						{(!!lightningInvoice || !!address) && (
							<>
								<Caption13Up style={styles.availableAmountText} color="gray1">
									Available
								</Caption13Up>
								<Money
									key="small"
									sats={availableAmount}
									size="caption13M"
									{...availableAmountProps}
								/>
							</>
						)}
					</View>
				)}

				{!showNumberPad && (
					<>
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
							<TouchableOpacity
								style={styles.inputAction}
								onPress={(): void => {
									handlePaste('').then();
								}}>
								<ClipboardTextIcon color="brand" width={24} />
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.inputAction}
								onPress={handleSendToContact}>
								<UserIcon color="brand" width={24} />
							</TouchableOpacity>
						</AddressOrSlashpay>

						{!showNumberPad && (
							<AnimatedView
								style={styles.bottom}
								color="transparent"
								entering={FadeIn}
								exiting={FadeOut}>
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
											Keyboard.dismiss();
											navigation.navigate('Tags');
										}}
									/>
								</View>
								<View style={buttonContainerStyles}>
									{!keyboardShown && (
										<Button
											size="large"
											text="Continue"
											disabled={isInvalid()}
											onPress={(): void => {
												let view: keyof SendStackParamList = 'ReviewAndSend';
												// If auto coin-select is disabled and there is no lightning invoice.
												if (!coinSelectAuto && !transaction?.lightningInvoice) {
													view = 'CoinSelection';
												}
												navigation.navigate(view);
											}}
										/>
									)}
								</View>
							</AnimatedView>
						)}
					</>
				)}

				{showNumberPad && (
					<SendNumberPad
						onDone={(): void => {
							setShowNumberPad(false);
						}}
					/>
				)}
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
	amountToggle: {
		marginBottom: 28,
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
	bottom: {
		flex: 1,
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
		flexGrow: 1,
		justifyContent: 'flex-end',
	},
	availableAmount: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginTop: 42,
		marginBottom: 5,
		paddingBottom: 16,
	},
	availableAmountText: {
		marginBottom: 5,
	},
});

export default memo(AddressAndAmount);
