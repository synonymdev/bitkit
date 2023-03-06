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
import { useTranslation } from 'react-i18next';

import { Caption13Up, Text02M } from '../../../styles/text';
import {
	Checkmark,
	ClockIcon,
	PencileIcon,
	SettingsIcon,
	SpeedFastIcon,
	SpeedNormalIcon,
	SpeedSlowIcon,
	TagIcon,
	TimerIcon,
} from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import SwipeToConfirm from '../../../components/SwipeToConfirm';
import AmountToggle from '../../../components/AmountToggle';
import Tag from '../../../components/Tag';
import ContactSmall from '../../../components/ContactSmall';
import { IOutput } from '../../../store/types/wallet';
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
import { EFeeId } from '../../../store/types/fees';
import {
	decodeLightningInvoice,
	payLightningInvoice,
} from '../../../utils/lightning';
import { getFiatDisplayValues } from '../../../utils/exchange-rate';
import { showErrorNotification } from '../../../utils/notifications';
import { refreshWallet } from '../../../utils/wallet';
import type { SendScreenProps } from '../../../navigation/types';
import Dialog from '../../../components/Dialog';
import { useLightningBalance } from '../../../hooks/lightning';
import Biometrics from '../../../components/Biometrics';
import Button from '../../../components/Button';
import Store from '../../../store/types';
import {
	exchangeRatesSelector,
	onChainBalanceSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import {
	bitcoinUnitSelector,
	enableSendAmountWarningSelector,
} from '../../../store/reselect/settings';
import { onChainFeesSelector } from '../../../store/reselect/fees';
import { updateOnChainActivityList } from '../../../store/actions/activity';

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
	const { t, i18n } = useTranslation('wallet');
	const insets = useSafeAreaInsets();
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const onChainBalance = useSelector(onChainBalanceSelector);
	const transaction = useSelector(transactionSelector);
	const lightningBalance = useLightningBalance(false);
	const bitcoinUnit = useSelector(bitcoinUnitSelector);
	const exchangeRates = useSelector(exchangeRatesSelector);
	const feeEstimates = useSelector(onChainFeesSelector);
	const enableSendAmountWarning = useSelector(enableSendAmountWarningSelector);
	const pin = useSelector((state: Store) => state.settings.pin);
	const biometrics = useSelector((state: Store) => state.settings.biometrics);
	const pinForPayments = useSelector(
		(state: Store) => state.settings.pinForPayments,
	);

	const [isLoading, setIsLoading] = useState(false);
	const [showBiotmetrics, setShowBiometrics] = useState(false);
	const [showDialog1, setShowDialog1] = useState(false);
	const [showDialog2, setShowDialog2] = useState(false);
	const [showDialog3, setShowDialog3] = useState(false);
	const [showDialog4, setShowDialog4] = useState(false);
	const [showDialog5, setShowDialog5] = useState(false);
	const [dialogWarnings, setDialogWarnings] = useState<string[]>([]);
	const [rawTx, setRawTx] = useState<{ hex: string; id: string }>();
	const [decodedInvoice, setDecodedInvoice] = useState<TInvoice>();

	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

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
		return amount + totalFee;
	}, [amount, totalFee]);

	// TODO:
	const index = 0;

	/**
	 * Returns the current output by index.
	 */
	const getOutput = useMemo((): IOutput => {
		return transaction.outputs[index] ?? { address: '', value: 0, index: 0 };
	}, [index, transaction.outputs]);

	/**
	 * Returns the current address to send funds to.
	 */
	const address = useMemo((): string => {
		return getOutput.address ?? '';
	}, [getOutput.address]);

	const selectedFeeId = useMemo(
		() => transaction.selectedFeeId,
		[transaction.selectedFeeId],
	);

	const satsPerByte = useMemo((): number => {
		return transaction.satsPerByte;
	}, [transaction.satsPerByte]);

	const getFee = useCallback(
		(_satsPerByte: number) => {
			return getTotalFee({
				satsPerByte: _satsPerByte,
				message: transaction.message,
				selectedWallet,
				selectedNetwork,
			});
		},
		[selectedNetwork, selectedWallet, transaction.message],
	);

	useEffect(() => {
		setupFeeForOnChainTransaction();
	}, []);

	const _onError = useCallback(
		(errorTitle: string, errorMessage: string) => {
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
			_onError(t('send_error_create_tx'), t('error_no_invoice'));
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
			_onError(t('send_error_create_tx'), payInvoiceResponse.error.message);
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
		setIsLoading(false);

		navigation.navigate('Result', {
			success: true,
			txId: payInvoiceResponse.value.payment_hash,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		_onError,
		decodedInvoice?.amount_satoshis,
		transaction.lightningInvoice,
		transaction.outputs,
		transaction.tags,
		t,
	]);

	const createOnChainTransaction = useCallback(async (): Promise<void> => {
		try {
			setIsLoading(true);
			const transactionIsValid = validateTransaction(transaction);
			if (transactionIsValid.isErr()) {
				setIsLoading(false);
				_onError(t('send_error_create_tx'), transactionIsValid.error.message);
				return;
			}
			const response = await createTransaction({
				selectedNetwork,
				selectedWallet,
			});
			if (response.isErr()) {
				setIsLoading(false);
				_onError(t('send_error_create_tx'), response.error.message);
				return;
			}
			if (__DEV__) {
				console.log(response.value);
			}
			setRawTx(response.value);
		} catch (error) {
			_onError(t('send_error_create_tx'), (error as Error).message);
			setIsLoading(false);
		}
	}, [selectedNetwork, selectedWallet, transaction, _onError, t]);

	const _broadcast = useCallback(async () => {
		if (!rawTx?.id || !rawTx?.hex) {
			_onError(t('error_no_tx_title'), t('error_no_tx_msg'));
			return;
		}
		const response = await broadcastTransaction({
			rawTx: rawTx.hex,
			selectedNetwork,
		});
		if (response.isErr()) {
			// Check if it failed to broadcast due to low fee.
			if (response.error.message.includes('min relay fee not met')) {
				_onError(t('error_min_fee_title'), t('error_min_fee_msg'));
			} else {
				// Most likely a connection error with the Electrum server.
				// TODO: Add a backup method to broadcast via an api if unable to broadcast through Electrum.
				_onError(
					t('error_broadcast_tx'),
					t('error_broadcast_tx_connection', {
						message: response.error.message,
					}),
				);
			}
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

		updateOnChainActivityList();
		setIsLoading(false);

		navigation.navigate('Result', { success: true, txId: rawTx.id });
	}, [
		onChainBalance,
		rawTx,
		selectedNetwork,
		selectedWallet,
		transactionTotal,
		_onError,
		navigation,
		transaction,
		t,
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
			? ` (${totalFeeDisplay.fiatSymbol}${totalFeeDisplay.fiatFormatted})`
			: '';

	const runCreateTxMethods = useCallback((): void => {
		if (transaction.lightningInvoice) {
			createLightningTransaction().then();
		} else {
			createOnChainTransaction().then();
		}
	}, [
		transaction.lightningInvoice,
		createLightningTransaction,
		createOnChainTransaction,
	]);

	const navigateToPin = useCallback(() => {
		navigation.navigate('PinCheck', {
			onSuccess: () => {
				navigation.pop();
				runCreateTxMethods();
			},
		});
	}, [navigation, runCreateTxMethods]);

	const showDialogWarning = useCallback((dialogId) => {
		switch (dialogId) {
			case 'dialog1':
				setShowDialog1(true);
				break;
			case 'dialog2':
				setShowDialog2(true);
				break;
			case 'dialog3':
				setShowDialog3(true);
				break;
			case 'dialog4':
				setShowDialog4(true);
				break;
			case 'dialog5':
				setShowDialog5(true);
				break;
		}
	}, []);

	const confirmPayment = useCallback(
		(warnings: string[] = []) => {
			if (warnings.length > 0) {
				showDialogWarning(warnings[0]);
				setDialogWarnings(warnings.slice(1));
				return;
			}

			if (pin && pinForPayments) {
				if (biometrics) {
					setShowBiometrics(true);
				} else {
					setIsLoading(false);
					navigateToPin();
				}
			} else {
				runCreateTxMethods();
			}
		},
		[
			biometrics,
			navigateToPin,
			pin,
			pinForPayments,
			runCreateTxMethods,
			showDialogWarning,
		],
	);

	const handleTagRemove = useCallback(
		(tag: string) => {
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
		const warnings: string[] = [];
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
		if (transaction.lightningInvoice) {
			// If lightning tx use lightning balance.
			if (amount > lightningBalance.localBalance / 2) {
				warnings.push('dialog2');
			}
		} else {
			// If on-chain tx use on-chain balance.
			if (amount > onChainBalance / 2) {
				warnings.push('dialog2');
			}
		}

		// amount > 100$ and enableSendAmountWarning
		if (amountFiat > 100 && enableSendAmountWarning) {
			warnings.push('dialog1');
		}

		// fee > 10$
		if (feeFiat > 10) {
			warnings.push('dialog4');
		}

		// Check if the user is setting the minimum relay fee given the current fee environment.
		if (
			transaction.satsPerByte &&
			// This check is to prevent situations where all values are set to 1sat/vbyte. Where setting 1sat/vbyte is perfectly fine.
			feeEstimates.minimum < feeEstimates.slow &&
			transaction.satsPerByte <= feeEstimates.minimum
		) {
			warnings.push('dialog5');
		}

		// fee > 50% of send amount
		if (!transaction.lightningInvoice && feeSats > amount / 2) {
			warnings.push('dialog3');
		}
		confirmPayment(warnings);
	}, [
		amount,
		exchangeRates,
		bitcoinUnit,
		feeSats,
		transaction.lightningInvoice,
		transaction.satsPerByte,
		enableSendAmountWarning,
		feeEstimates.minimum,
		feeEstimates.slow,
		confirmPayment,
		lightningBalance.localBalance,
		onChainBalance,
	]);

	const feeDescription = useMemo(() => {
		if (selectedFeeId !== EFeeId.custom) {
			return t(`fee:${selectedFeeId}.description`);
		}

		let desc = t('fee:custom.description');

		// try to get nice fee description if our cusom fee matches one of feeEstimates
		for (const key of ['minimum', 'slow', 'normal', 'fast']) {
			const newDescId = `fee:${key}.description`;
			if (
				key in feeEstimates &&
				satsPerByte >= feeEstimates[key] &&
				i18n.exists(newDescId)
			) {
				desc = t(newDescId);
			}
		}
		return desc;
	}, [selectedFeeId, feeEstimates, t, i18n, satsPerByte]);

	const feeIcon = useMemo(() => {
		switch (selectedFeeId) {
			case EFeeId.fast:
				return (
					<SpeedFastIcon
						style={styles.icon}
						color="brand"
						width={16}
						height={16}
					/>
				);
			case EFeeId.normal:
				return (
					<SpeedNormalIcon
						style={styles.icon}
						color="brand"
						width={16}
						height={16}
					/>
				);
			case EFeeId.slow:
				return (
					<SpeedSlowIcon
						style={styles.icon}
						color="brand"
						width={16}
						height={16}
					/>
				);
			case EFeeId.custom:
				return (
					<SettingsIcon
						style={styles.icon}
						color="gray1"
						width={16}
						height={16}
					/>
				);
		}
	}, [selectedFeeId]);

	return (
		<>
			<GradientView style={styles.container}>
				<BottomSheetNavigationHeader title={t('send_review')} />
				<View style={styles.content}>
					<AmountToggle
						style={styles.amountToggle}
						sats={amount}
						reverse={true}
					/>

					<View style={styles.sectionContainer}>
						<Section
							title={t(
								transaction.slashTagsUrl || !decodedInvoice
									? 'send_to'
									: 'send_invoice',
							)}
							value={
								transaction.slashTagsUrl ? (
									<ContactSmall url={transaction.slashTagsUrl} size="large" />
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
								title={t('send_fee_and_speed')}
								onPress={(): void => navigation.navigate('FeeRate')}
								value={
									<>
										{feeIcon}
										<Text02M>
											{t(`fee:${selectedFeeId}.title`)}
											{feeAmount}
										</Text02M>
										<PencileIcon height={12} width={22} />
									</>
								}
							/>
							<Section
								title={t('send_confirming_in')}
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
								title={t('send_fee_and_speed')}
								value={
									<>
										<TimerIcon style={styles.icon} color="purple" />
										<Text02M>{FeeText.instant.title} (±$0.01)</Text02M>
									</>
								}
							/>
							{decodedInvoice?.expiry_time && (
								<Section
									title={t('send_invoice_expiration')}
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
								title={t('note')}
								value={<Text02M>{decodedInvoice?.description}</Text02M>}
							/>
						</View>
					) : null}

					<View style={styles.sectionContainer}>
						<Section
							title={t('tags')}
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
											text={t('tags_add')}
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
							text={t('send_swipe')}
							onConfirm={onSwipeToPay}
							icon={<Checkmark width={30} height={30} color="black" />}
							loading={isLoading}
							confirmed={isLoading}
						/>
					</View>
				</View>

				<Dialog
					visible={showDialog1}
					title={t('are_you_sure')}
					description={t('send_dialog1')}
					confirmText={t('send_yes')}
					onCancel={(): void => {
						setShowDialog1(false);
						setTimeout(() => navigation.goBack(), 100);
					}}
					onConfirm={(): void => {
						setShowDialog1(false);
						confirmPayment(dialogWarnings);
					}}
				/>
				<Dialog
					visible={showDialog2}
					title={t('are_you_sure')}
					description={t('send_dialog2')}
					confirmText={t('send_yes')}
					onCancel={(): void => {
						setShowDialog2(false);
						setTimeout(() => navigation.goBack(), 100);
					}}
					onConfirm={(): void => {
						setShowDialog2(false);
						confirmPayment(dialogWarnings);
					}}
					visibleTestID="DialogSend50"
				/>
				<Dialog
					visible={showDialog3}
					title={t('are_you_sure')}
					description={t('send_dialog3')}
					confirmText={t('send_yes')}
					onCancel={(): void => {
						setShowDialog3(false);
						setTimeout(() => navigation.goBack(), 100);
					}}
					onConfirm={(): void => {
						setShowDialog3(false);
						confirmPayment(dialogWarnings);
					}}
				/>
				<Dialog
					visible={showDialog4}
					title={t('are_you_sure')}
					description={t('send_dialog4')}
					confirmText={t('send_yes')}
					onCancel={(): void => {
						setShowDialog4(false);
						setTimeout(() => navigation.goBack(), 100);
					}}
					onConfirm={(): void => {
						setShowDialog4(false);
						confirmPayment(dialogWarnings);
					}}
				/>
				<Dialog
					visible={showDialog5}
					title={t('send_dialog5_title')}
					description={t('send_dialog5_description', {
						minimumFee: feeEstimates.minimum,
					})}
					confirmText={t('continue')}
					onCancel={(): void => {
						setShowDialog5(false);
						setTimeout(() => navigation.goBack(), 100);
					}}
					onConfirm={async (): Promise<void> => {
						setShowDialog5(false);
						confirmPayment(dialogWarnings);
					}}
				/>
			</GradientView>

			{showBiotmetrics && (
				<Biometrics
					onSuccess={(): void => {
						setShowBiometrics(false);
						runCreateTxMethods();
					}}
					onFailure={(): void => {
						setIsLoading(false);
						setShowBiometrics(false);
						navigateToPin();
					}}
				/>
			)}
		</>
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
		marginRight: 6,
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
