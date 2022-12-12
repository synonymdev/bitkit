import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TInvoice } from '@synonymdev/react-native-ldk';

import {
	Caption13Up,
	Checkmark,
	ClockIcon,
	PenIcon,
	TagIcon,
	Text02M,
	TimerIcon,
} from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import SwipeToConfirm from '../../../components/SwipeToConfirm';
import AmountToggle from '../../../components/AmountToggle';
import Tag from '../../../components/Tag';
import ContactSmall from '../../../components/ContactSmall';
import Store from '../../../store/types';
import { IOutput } from '../../../store/types/wallet';
import { useTransactionDetails } from '../../../hooks/transaction';
import {
	broadcastTransaction,
	createTransaction,
	getTotalFee,
	getTransactionOutputValue,
	validateTransaction,
} from '../../../utils/wallet/transactions';
import {
	updateWalletBalance,
	setupFeeForOnChainTransaction,
	removeTxTag,
} from '../../../store/actions/wallet';
import {
	updateMetaTxTags,
	addMetaSlashTagsUrlTag,
} from '../../../store/actions/metadata';
import useColors from '../../../hooks/colors';
import useDisplayValues from '../../../hooks/displayValues';
import { FeeText } from '../../../store/shapes/fees';
import { hasEnabledAuthentication } from '../../../utils/settings';
import { EFeeIds } from '../../../store/types/fees';
import {
	decodeLightningInvoice,
	payLightningInvoice,
} from '../../../utils/lightning';
import { refreshWallet } from '../../../utils/wallet';
import type { SendScreenProps } from '../../../navigation/types';
import Dialog from '../../../components/Dialog';
import { getFiatDisplayValues } from '../../../utils/exchange-rate';
import { useLightningBalance } from '../../../hooks/lightning';
import Button from '../../../components/Button';
import { showErrorNotification } from '../../../utils/notifications';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const Section = memo(
	({
		title,
		value,
		onPress,
	}: {
		title: string;
		value: ReactNode;
		onPress?: () => void;
	}) => {
		const { white1 } = useColors();
		return (
			<TouchableOpacity
				style={[styles.sRoot, { borderBottomColor: white1 }]}
				activeOpacity={onPress ? 0.6 : 1}
				onPress={onPress}>
				<View style={styles.sText}>
					<Caption13Up color="gray1">{title}</Caption13Up>
				</View>
				<View style={styles.sValue}>{value}</View>
			</TouchableOpacity>
		);
	},
);

const ReviewAndSend = ({
	navigation,
}: SendScreenProps<'ReviewAndSend'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const feeEstimates = useSelector((store: Store) => store.fees.onchain);
	const enableSendAmountWarning = useSelector(
		(store: Store) => store.settings.enableSendAmountWarning,
	);

	const [isLoading, setIsLoading] = useState(false);
	const [showDialog1, setShowDialog1] = useState(false);
	const [showDialog2, setShowDialog2] = useState(false);
	const [showDialog3, setShowDialog3] = useState(false);
	const [showDialog4, setShowDialog4] = useState(false);
	const [rawTx, setRawTx] = useState<{ hex: string; id: string } | undefined>();
	const [decodedInvoice, setDecodedInvoice] = useState<TInvoice>();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const onChainBalance = useSelector(
		(store: Store) =>
			store.wallet.wallets[selectedWallet]?.balance[selectedNetwork],
	);

	const lightningBalance = useLightningBalance(false);
	const transaction = useTransactionDetails();

	const decodeAndSetLightningInvoice = async (): Promise<void> => {
		try {
			if (!transaction.lightningInvoice) {
				return;
			}
			const decodeInvoiceResponse = await decodeLightningInvoice({
				paymentRequest: transaction.lightningInvoice,
			});
			if (decodeInvoiceResponse.isErr()) {
				return;
			}
			setDecodedInvoice(decodeInvoiceResponse.value);
		} catch (e) {
			console.log(e);
		}
	};

	useEffect(() => {
		decodeAndSetLightningInvoice().then();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.lightningInvoice]);

	const totalFee = transaction.fee;

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
	}, [transaction.outputs, selectedNetwork, selectedWallet]);

	const transactionTotal = useMemo((): number => {
		try {
			return Number(amount) + Number(totalFee);
		} catch {
			return Number(totalFee);
		}
	}, [amount, totalFee]);

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
		try {
			return getOutput?.address || '';
		} catch (e) {
			console.log(e);
			return '';
		}
	}, [getOutput?.address]);

	const selectedFeeId = useMemo(
		() => transaction.selectedFeeId ?? EFeeIds.slow,
		[transaction.selectedFeeId],
	);

	const satsPerByte = useMemo((): number => {
		try {
			return transaction.satsPerByte ?? 1;
		} catch (e) {
			return 1;
		}
	}, [transaction.satsPerByte]);

	const getFee = useCallback(
		(_satsPerByte = 1) => {
			const message = transaction.message;
			return getTotalFee({
				satsPerByte: _satsPerByte,
				message,
				selectedWallet,
				selectedNetwork,
			});
		},
		[selectedNetwork, selectedWallet, transaction.message],
	);

	useEffect(() => {
		(async (): Promise<void> => {
			const res = await setupFeeForOnChainTransaction();
			if (res.isErr()) {
				console.log(res.error.message);
			}
		})();
	}, []);

	const _onError = useCallback(
		(errorTitle, errorMessage) => {
			navigation.navigate('Result', {
				success: false,
				errorTitle,
				errorMessage,
			});
		},
		[navigation],
	);

	const createLightningTransaction = useCallback(async () => {
		if (!transaction.lightningInvoice) {
			_onError('Error creating transaction', 'No lightning invoice found.');
			setIsLoading(false);
			return;
		}
		const amountRequestedFromInvoice = decodedInvoice?.amount_satoshis ?? 0;
		// Determine if we should add a custom sat value to the lightning invoice.
		let customSatAmount = 0;
		if (
			amountRequestedFromInvoice <= 0 &&
			transaction.outputs &&
			(transaction.outputs[0].value ?? 0) > 0
		) {
			customSatAmount = transaction.outputs[0].value ?? 0;
		}
		const payInvoiceResponse = await payLightningInvoice(
			transaction.lightningInvoice,
			customSatAmount,
		);
		if (payInvoiceResponse.isErr()) {
			_onError('Error creating transaction', payInvoiceResponse.error.message);
			setIsLoading(false);
			return;
		}

		// save tags to metadata
		updateMetaTxTags(transaction.lightningInvoice, transaction.tags);
		// save Slashtags contact to metadata
		if (transaction.slashTagsUrl) {
			addMetaSlashTagsUrlTag(
				transaction.lightningInvoice,
				transaction.slashTagsUrl,
			);
		}
		refreshWallet({ onchain: false, lightning: true }).then();
		//TODO: pass txId to Result screen
		navigation.navigate('Result', { success: true });
		setIsLoading(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		_onError,
		decodedInvoice?.amount_satoshis,
		transaction.lightningInvoice,
		transaction.outputs,
		transaction.tags,
	]);

	const createOnChainTransaction = useCallback(async (): Promise<void> => {
		try {
			setIsLoading(true);
			const transactionIsValid = validateTransaction(transaction);
			if (transactionIsValid.isErr()) {
				setIsLoading(false);
				_onError(
					'Error creating transaction',
					transactionIsValid.error.message,
				);
				return;
			}
			const response = await createTransaction({
				selectedNetwork,
				selectedWallet,
			});
			if (response.isErr()) {
				setIsLoading(false);
				_onError('Error creating transaction', response.error.message);
				return;
			}
			if (__DEV__) {
				console.log(response.value);
			}
			setRawTx(response.value);
		} catch (error) {
			_onError('Error creating transaction', (error as Error).message);
			setIsLoading(false);
		}
	}, [selectedNetwork, selectedWallet, transaction, _onError]);

	const _broadcast = useCallback(async () => {
		if (!rawTx || !rawTx?.id || !rawTx?.hex) {
			_onError(
				'Error: No transaction is available to broadcast.',
				'Please check your transaction info and try again.',
			);
			return;
		}
		const response = await broadcastTransaction({
			rawTx: rawTx.hex,
			selectedNetwork,
		});
		if (response.isErr()) {
			_onError(
				'Error: Unable to Broadcast Transaction',
				'Please check your connection and try again.',
			);
			setIsLoading(false);
			return;
		}

		//Temporarily update the balance until the Electrum mempool catches up in a few seconds.
		updateWalletBalance({
			balance: onChainBalance - transactionTotal,
			selectedWallet,
			selectedNetwork,
		});

		// save tags to metadata
		updateMetaTxTags(rawTx.id, transaction.tags);
		// save Slashtags contact to metadata
		if (transaction.slashTagsUrl) {
			addMetaSlashTagsUrlTag(rawTx.id, transaction.slashTagsUrl);
		}

		navigation.navigate('Result', { success: true, txId: rawTx.id });
		setIsLoading(false);
	}, [
		onChainBalance,
		rawTx,
		selectedNetwork,
		selectedWallet,
		transactionTotal,
		_onError,
		navigation,
		transaction,
	]);

	useEffect(() => {
		if (rawTx) {
			_broadcast().then();
		}
	}, [rawTx, _broadcast]);

	const feeSats = getFee(satsPerByte);
	const totalFeeDisplay = useDisplayValues(feeSats);
	const feeAmount =
		totalFeeDisplay.fiatFormatted !== '—'
			? ` (${totalFeeDisplay.fiatSymbol} ${totalFeeDisplay.fiatFormatted})`
			: '';

	const confirmPayment = useCallback(async () => {
		const { pin, pinForPayments } = hasEnabledAuthentication();
		const runCreateTxMethods = (): void => {
			if (transaction.lightningInvoice) {
				createLightningTransaction().then();
			} else {
				createOnChainTransaction().then();
			}
		};

		if (pin && pinForPayments) {
			navigation.navigate('AuthCheck', {
				onSuccess: () => {
					navigation.pop();
					runCreateTxMethods();
				},
			});
		} else {
			runCreateTxMethods();
		}
	}, [
		createLightningTransaction,
		createOnChainTransaction,
		navigation,
		transaction.lightningInvoice,
	]);
	const bitcoinUnit = useSelector((state: Store) => state.settings.bitcoinUnit);
	const exchangeRates = useSelector(
		(state: Store) => state.wallet.exchangeRates,
	);

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

	const onSwipeToPay = useCallback(async () => {
		setIsLoading(true);

		const { fiatValue: amountFiat } = getFiatDisplayValues({
			satoshis: amount,
			currency: 'USD',
			exchangeRates,
			bitcoinUnit,
		});

		const { fiatValue: feeFiat } = getFiatDisplayValues({
			satoshis: feeSats,
			currency: 'USD',
			exchangeRates,
			bitcoinUnit,
		});

		// amount > 50% of total balance
		if (transaction?.lightningInvoice) {
			// If lightning tx use lightning balance.
			if (amount > lightningBalance.localBalance / 2) {
				setShowDialog2(true);
				return;
			}
		} else {
			// If on-chain tx use on-chain balance.
			if (amount > onChainBalance / 2) {
				setShowDialog2(true);
				return;
			}
		}

		// amount > 100$ and enableSendAmountWarning
		if (amountFiat > 100 && enableSendAmountWarning) {
			setShowDialog1(true);
			return;
		}

		// fee > 10$
		if (feeFiat > 10) {
			setShowDialog4(true);
			return;
		}

		// fee > 50% of send amount
		if (!transaction?.lightningInvoice && feeSats > amount / 2) {
			setShowDialog3(true);
			return;
		}

		confirmPayment();
	}, [
		amount,
		exchangeRates,
		bitcoinUnit,
		feeSats,
		transaction?.lightningInvoice,
		enableSendAmountWarning,
		confirmPayment,
		lightningBalance.localBalance,
		onChainBalance,
	]);

	const customDescription = useMemo(() => {
		let desc = FeeText.custom.description;
		if (selectedFeeId === EFeeIds.custom) {
			for (const key of Object.keys(feeEstimates)) {
				if (satsPerByte >= feeEstimates[key] && key in FeeText) {
					desc = FeeText[key]?.description ?? '';
					break;
				}
			}
		}
		return desc;
	}, [selectedFeeId, feeEstimates, satsPerByte]);

	const feeDescription = useMemo(() => {
		return selectedFeeId === EFeeIds.custom
			? customDescription
			: FeeText[selectedFeeId].description;
	}, [customDescription, selectedFeeId]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Review & Send" />
			<View style={styles.content}>
				<AmountToggle
					style={styles.amountToggle}
					sats={amount}
					reverse={true}
				/>

				<View style={styles.sectionContainer}>
					<Section
						title={
							transaction.slashTagsUrl || !decodedInvoice ? 'To' : 'Invoice'
						}
						value={
							transaction.slashTagsUrl ? (
								<ContactSmall url={transaction.slashTagsUrl} />
							) : (
								<Text02M numberOfLines={1} ellipsizeMode="middle">
									{decodedInvoice ? decodedInvoice.to_str : address}
								</Text02M>
							)
						}
					/>
				</View>

				{!transaction.lightningInvoice ? (
					<View style={styles.sectionContainer}>
						<Section
							title="Speed and fee"
							onPress={(): void => navigation.navigate('FeeRate')}
							value={
								<>
									<TimerIcon style={styles.icon} color="brand" />
									<Text02M>
										{FeeText[selectedFeeId].title}
										{feeAmount}
									</Text02M>
									<PenIcon height={16} width={20} />
								</>
							}
						/>
						<Section
							title="Confirming in"
							onPress={(): void => navigation.navigate('FeeRate')}
							value={
								<>
									<ClockIcon style={styles.icon} color="brand" />
									<Text02M>{feeDescription}</Text02M>
								</>
							}
						/>
					</View>
				) : (
					<View style={styles.sectionContainer}>
						<Section
							title="Speed and fee"
							value={
								<>
									<TimerIcon style={styles.icon} color="purple" />
									<Text02M>{FeeText.instant.title} (±$0.01)</Text02M>
								</>
							}
						/>
						{decodedInvoice?.expiry_time && (
							<Section
								title="Invoice expiration"
								value={
									<>
										<ClockIcon style={styles.icon} color="purple" />
										<Text02M>
											{(decodedInvoice.expiry_time / 60).toFixed()} minutes
										</Text02M>
									</>
								}
							/>
						)}
					</View>
				)}

				{decodedInvoice?.description ? (
					<View style={styles.sectionContainer}>
						<Section
							title="Note"
							value={<Text02M>{decodedInvoice?.description}</Text02M>}
						/>
					</View>
				) : null}

				<View style={styles.sectionContainer}>
					<Section
						title="Tags"
						value={
							<View>
								<View style={styles.tagsContainer}>
									{transaction.tags?.map((tag) => (
										<Tag
											key={tag}
											style={styles.tag}
											value={tag}
											onClose={(): void => handleTagRemove(tag)}
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
							</View>
						}
					/>
				</View>

				<View style={nextButtonContainer}>
					<SwipeToConfirm
						text="Swipe To Pay"
						onConfirm={onSwipeToPay}
						icon={<Checkmark width={30} height={30} color="black" />}
						loading={isLoading}
						confirmed={isLoading}
					/>
				</View>
			</View>

			<Dialog
				visible={showDialog1}
				title="Are You Sure?"
				description="It appears you are sending over $100. Do you want to continue?"
				confirmText="Yes, Send"
				onCancel={(): void => {
					setShowDialog1(false);
					setTimeout(() => navigation.goBack(), 100);
				}}
				onConfirm={(): void => {
					setShowDialog1(false);
					confirmPayment();
				}}
			/>
			<Dialog
				visible={showDialog2}
				title="Are You Sure?"
				description="It appears you are sending over 50% of your total balance. Do you want to continue?"
				confirmText="Yes, Send"
				onCancel={(): void => {
					setShowDialog2(false);
					setTimeout(() => navigation.goBack(), 100);
				}}
				onConfirm={(): void => {
					setShowDialog2(false);
					confirmPayment();
				}}
			/>
			<Dialog
				visible={showDialog3}
				title="Are You Sure?"
				description="The transaction fee appears to be over 50% of the amount you are sending. Do you want to continue?"
				confirmText="Yes, Send"
				onCancel={(): void => {
					setShowDialog3(false);
					setTimeout(() => navigation.goBack(), 100);
				}}
				onConfirm={(): void => {
					setShowDialog3(false);
					confirmPayment();
				}}
			/>
			<Dialog
				visible={showDialog4}
				title="Are You Sure?"
				description="The transaction fee appears to be over $10. Do you want to continue?"
				confirmText="Yes, Send"
				onCancel={(): void => {
					setShowDialog4(false);
					setTimeout(() => navigation.goBack(), 100);
				}}
				onConfirm={(): void => {
					setShowDialog4(false);
					confirmPayment();
				}}
			/>
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
	amountToggle: {
		marginBottom: 32,
	},
	sectionContainer: {
		marginHorizontal: -4,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	sRoot: {
		marginHorizontal: 4,
		marginBottom: 16,
		borderBottomWidth: 1,
		flex: 1,
	},
	sText: {
		marginBottom: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	sValue: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	icon: {
		marginRight: 4,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
	nextButtonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ReviewAndSend);
