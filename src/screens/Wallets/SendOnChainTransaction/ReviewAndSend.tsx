import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
	useEffect,
} from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TInvoice } from '@synonymdev/react-native-ldk';

import {
	Caption13Up,
	Checkmark,
	ClockIcon,
	PenIcon,
	Text02M,
	TimerIcon,
	View as ThemedView,
} from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
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

const Section = memo(
	({
		title,
		value,
		onPress,
	}: {
		title: string;
		value: React.ReactNode;
		onPress?: () => void;
	}) => {
		const { gray4 } = useColors();
		return (
			<TouchableOpacity
				style={[styles.sRoot, { borderBottomColor: gray4 }]}
				onPress={onPress}>
				<View style={styles.sText}>
					<Caption13Up color="gray1">{title}</Caption13Up>
				</View>
				<View style={styles.sValue}>{value}</View>
			</TouchableOpacity>
		);
	},
);

const ReviewAndSend = ({ navigation, index = 0 }): ReactElement => {
	const insets = useSafeAreaInsets();
	const [isLoading, setIsLoading] = useState(false);
	const [rawTx, setRawTx] = useState<{ hex: string; id: string } | undefined>(
		undefined,
	);
	const [decodedInvoice, setDecodedInvoice] = useState<TInvoice>();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
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
	const balance = useSelector(
		(store: Store) =>
			store.wallet.wallets[selectedWallet]?.balance[selectedNetwork],
	);

	const transaction = useTransactionDetails();

	const decodeAndSetLightningInvoice = async (): Promise<void> => {
		try {
			if (!transaction?.lightningInvoice) {
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

	const selectedFeeId = useMemo(
		() => transaction?.selectedFeeId ?? EFeeIds.slow,
		[transaction.selectedFeeId],
	);

	const satsPerByte = useMemo((): number => {
		try {
			return transaction?.satsPerByte ?? 1;
		} catch (e) {
			return 1;
		}
	}, [transaction?.satsPerByte]);

	const getFee = useCallback(
		(_satsPerByte = 1) => {
			const message = transaction?.message;
			return getTotalFee({
				satsPerByte: _satsPerByte,
				message,
				selectedWallet,
				selectedNetwork,
			});
		},
		[selectedNetwork, selectedWallet, transaction?.message],
	);

	useEffect(() => {
		(async (): Promise<void> => {
			const res = await setupFeeForOnChainTransaction();
			if (res.isErr()) {
				Alert.alert(res.error.message);
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
		if (!transaction?.lightningInvoice) {
			_onError('Error creating transaction', 'No lightning invoice found.');
			setIsLoading(false);
			return;
		}
		const amountRequestedFromInvoice = decodedInvoice?.amount_satoshis ?? 0;
		// Determine if we should add a custom sat value to the lightning invoice.
		let customSatAmount = 0;
		if (
			amountRequestedFromInvoice <= 0 &&
			transaction?.outputs &&
			(transaction?.outputs[0].value ?? 0) > 0
		) {
			customSatAmount = transaction?.outputs[0].value ?? 0;
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

		//TODO: Add lightning transaction to activity list.

		// save tags to metadata
		updateMetaTxTags(transaction.lightningInvoice, transaction?.tags);
		// save Slashtags contact to metadata
		if (transaction?.slashTagsUrl) {
			addMetaSlashTagsUrlTag(
				transaction.lightningInvoice,
				transaction?.slashTagsUrl,
			);
		}
		refreshWallet({ onchain: false, lightning: true }).then();
		navigation.navigate('Result', { success: true });
		setIsLoading(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		_onError,
		decodedInvoice?.amount_satoshis,
		transaction.lightningInvoice,
		transaction?.outputs,
		transaction?.tags,
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
			rawTx: rawTx?.hex ?? '',
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
			balance: balance - transactionTotal,
			selectedWallet,
			selectedNetwork,
		});

		// save tags to metadata
		updateMetaTxTags(rawTx?.id, transaction?.tags);
		// save Slashtags contact to metadata
		if (transaction?.slashTagsUrl) {
			addMetaSlashTagsUrlTag(rawTx?.id, transaction.slashTagsUrl);
		}

		navigation.navigate('Result', { success: true });
		setIsLoading(false);
	}, [
		balance,
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

	const handleConfirm = useCallback(async () => {
		setIsLoading(true);
		const { pin, pinForPayments } = hasEnabledAuthentication();
		const runCreateTxMethods = (): void => {
			if (transaction?.lightningInvoice) {
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
		transaction?.lightningInvoice,
	]);

	const feeSats = getFee(satsPerByte);
	const totalFeeDisplay = useDisplayValues(feeSats);

	let feeAmount =
		totalFeeDisplay.fiatFormatted !== '—'
			? ` (${totalFeeDisplay.fiatSymbol} ${totalFeeDisplay.fiatFormatted})`
			: '';

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<BottomSheetNavigationHeader title="Review & Send" />
			<View style={styles.content}>
				<AmountToggle sats={amount} style={styles.amountToggle} />

				<View style={styles.sectionContainer}>
					<Section
						title="TO"
						value={
							transaction?.slashTagsUrl ? (
								<ContactSmall url={transaction?.slashTagsUrl} />
							) : (
								<Text02M numberOfLines={1} ellipsizeMode="middle">
									{decodedInvoice
										? decodedInvoice?.description ?? decodedInvoice?.to_str
										: address}
								</Text02M>
							)
						}
					/>
				</View>
				{!transaction?.lightningInvoice && (
					<View style={styles.sectionContainer}>
						<Section
							title="SPEED AND FEE"
							onPress={(): void => navigation.navigate('FeeRate')}
							value={
								<>
									<TimerIcon color="brand" />
									<Text02M>
										{' '}
										{FeeText[selectedFeeId]?.title}
										{feeAmount}
									</Text02M>
									<PenIcon height={16} width={20} />
								</>
							}
						/>
						<Section
							title="CONFIRMING IN"
							onPress={(): void => navigation.navigate('FeeRate')}
							value={
								<>
									<ClockIcon color="brand" />
									<Text02M> {FeeText[selectedFeeId]?.description}</Text02M>
								</>
							}
						/>
					</View>
				)}
				{transaction.tags?.length ? (
					<View style={styles.sectionContainer}>
						<Section
							title="TAGS"
							value={
								<View style={styles.tagsContainer}>
									{transaction.tags?.map((tag) => (
										<Tag key={tag} value={tag} style={styles.tag} />
									))}
								</View>
							}
						/>
					</View>
				) : null}

				<View style={nextButtonContainer}>
					<SwipeToConfirm
						text="Swipe To Pay"
						onConfirm={handleConfirm}
						icon={<Checkmark width={30} height={30} color="black" />}
						loading={isLoading}
						confirmed={isLoading}
					/>
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
