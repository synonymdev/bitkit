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
import { TInvoice } from '@synonymdev/react-native-ldk';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { validateTransaction } from 'beignet';

import { Caption13Up, BodySSB } from '../../../styles/text';
import {
	Checkmark,
	ClockIcon,
	LightningHollow,
	PencilIcon,
	SettingsIcon,
	SpeedFastIcon,
	SpeedNormalIcon,
	SpeedSlowIcon,
	TagIcon,
} from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import SwipeToConfirm from '../../../components/SwipeToConfirm';
import Tag from '../../../components/Tag';
import ContactSmall from '../../../components/ContactSmall';
import {
	broadcastTransaction,
	createTransaction,
	getTotalFee,
	getTransactionOutputValue,
} from '../../../utils/wallet/transactions';
import { removeTxTag } from '../../../store/actions/wallet';
import {
	updateMetaTxTags,
	addMetaTxSlashtagsUrl,
} from '../../../store/slices/metadata';
import useColors from '../../../hooks/colors';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useLightningBalance } from '../../../hooks/lightning';
import { useBottomSheetScreenBackPress } from '../../../hooks/bottomSheet';
import { EFeeId } from '../../../store/types/fees';
import {
	decodeLightningInvoice,
	payLightningInvoice,
} from '../../../utils/lightning';
import { FeeText } from '../../../utils/fees';
import { getFiatDisplayValues } from '../../../utils/displayValues';
import { showToast } from '../../../utils/notifications';
import type { SendScreenProps } from '../../../navigation/types';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Money from '../../../components/Money';
import Dialog from '../../../components/Dialog';
import Biometrics from '../../../components/Biometrics';
import Button from '../../../components/buttons/Button';
import {
	exchangeRatesSelector,
	onChainBalanceSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import {
	enableSendAmountWarningSelector,
	pinForPaymentsSelector,
	pinSelector,
} from '../../../store/reselect/settings';
import { onChainFeesSelector } from '../../../store/reselect/fees';
import { addPendingPayment } from '../../../store/slices/lightning';
import { updateOnChainActivityList } from '../../../store/utils/activity';
import { updateLastPaidContacts } from '../../../store/slices/slashtags';
import { EActivityType } from '../../../store/types/activity';
import { sendTransactionSelector } from '../../../store/reselect/ui';
import { ellipsis, truncate } from '../../../utils/helpers';
import AmountToggle from '../../../components/AmountToggle';
import LightningSyncing from '../../../components/LightningSyncing';
import { i18nTime } from '../../../utils/i18n';

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
		const { white10 } = useColors();
		return (
			<TouchableOpacity
				style={[styles.sRoot, { borderBottomColor: white10 }]}
				activeOpacity={onPress ? 0.7 : 1}
				onPress={onPress}>
				<View style={styles.sText}>
					<Caption13Up color="secondary">{title}</Caption13Up>
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
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const onChainBalance = useAppSelector(onChainBalanceSelector);
	const transaction = useAppSelector(transactionSelector);
	const lightningBalance = useLightningBalance(false);
	const dispatch = useAppDispatch();
	const exchangeRates = useAppSelector(exchangeRatesSelector);
	const feeEstimates = useAppSelector(onChainFeesSelector);
	const enableSendAmountWarning = useAppSelector(
		enableSendAmountWarningSelector,
	);
	const pin = useAppSelector(pinSelector);
	const pinForPayments = useAppSelector(pinForPaymentsSelector);
	const biometrics = useAppSelector((state) => state.settings.biometrics);
	const { paymentMethod, uri } = useAppSelector(sendTransactionSelector);
	const usesLightning = paymentMethod === 'lightning';

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

	useBottomSheetScreenBackPress();

	useEffect(() => {
		const decodeAndSetLightningInvoice = async (): Promise<void> => {
			if (!usesLightning || !transaction.lightningInvoice) {
				setDecodedInvoice(undefined);
				return;
			}
			const result = await decodeLightningInvoice(transaction.lightningInvoice);
			if (result.isErr()) {
				setDecodedInvoice(undefined);
				console.log(result.error.message);
				return;
			}
			setDecodedInvoice(result.value);
		};

		decodeAndSetLightningInvoice();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.lightningInvoice]);

	/*
	 * Total value of all outputs. Excludes change address.
	 */
	const amount = useMemo((): number => {
		return getTransactionOutputValue({
			outputs: transaction.outputs,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, selectedNetwork, selectedWallet]);

	const { selectedFeeId, satsPerByte } = transaction;

	const onError = useCallback(
		(errorMessage: string) => {
			navigation.navigate('Error', { errorMessage });
		},
		[navigation],
	);

	const createLightningTransaction = useCallback(async () => {
		if (!transaction.lightningInvoice || !decodedInvoice) {
			setIsLoading(false);
			onError(t('send_error_create_tx'));
			return;
		}

		// save tags metadata
		dispatch(
			updateMetaTxTags({
				txId: decodedInvoice.payment_hash,
				tags: transaction.tags,
			}),
		);

		if (transaction.slashTagsUrl) {
			// save contact metadata
			dispatch(updateLastPaidContacts(transaction.slashTagsUrl));
			dispatch(
				addMetaTxSlashtagsUrl({
					txId: decodedInvoice.payment_hash,
					url: transaction.slashTagsUrl,
				}),
			);
		}

		// Determine if we should override the invoice amount
		const paymentAmount = decodedInvoice.amount_satoshis ?? amount;

		const payInvoiceResponse = await payLightningInvoice({
			invoice: transaction.lightningInvoice,
			// If the invoice has an amount, leave undefined
			amount: !decodedInvoice.amount_satoshis ? paymentAmount : undefined,
		});

		setIsLoading(false);

		if (payInvoiceResponse.isErr()) {
			const errorMessage = payInvoiceResponse.error.message;
			if (errorMessage === 'Timed Out.') {
				dispatch(
					addPendingPayment({
						payment_hash: decodedInvoice.payment_hash,
						amount: paymentAmount,
					}),
				);
				navigation.navigate('Pending', { txId: decodedInvoice.payment_hash });
				return;
			}

			console.error(errorMessage);
			onError(t('send_error_create_tx'));
			return;
		}

		navigation.navigate('Success', {
			type: EActivityType.lightning,
			amount,
			txId: decodedInvoice.payment_hash,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		onError,
		amount,
		decodedInvoice?.amount_satoshis,
		transaction.lightningInvoice,
		transaction.outputs,
		transaction.tags,
		dispatch,
		t,
	]);

	const createOnChainTransaction = useCallback(async (): Promise<void> => {
		try {
			setIsLoading(true);
			const transactionIsValid = validateTransaction(transaction);
			if (transactionIsValid.isErr()) {
				throw Error(transactionIsValid.error.message);
			}
			const response = await createTransaction();
			if (response.isErr()) {
				throw Error(response.error.message);
			}
			setRawTx(response.value);
		} catch (error) {
			setIsLoading(false);
			console.error(error.message);
			onError(t('send_error_create_tx'));
		}
	}, [transaction, onError, t]);

	const _broadcast = useCallback(async () => {
		if (!rawTx?.id || !rawTx?.hex) {
			onError(`${t('error_no_tx_title')}. ${t('error_no_tx_msg')}`);
			return;
		}
		const response = await broadcastTransaction({ rawTx: rawTx.hex });
		if (response.isErr()) {
			// Check if it failed to broadcast due to low fee.
			if (response.error.message.includes('min relay fee not met')) {
				onError(`${(t('error_min_fee_title'), t('error_min_fee_msg'))}`);
			} else {
				// Most likely a connection error with the Electrum server.
				// TODO: Add a backup method to broadcast via an api if unable to broadcast through Electrum.
				onError(
					`${t('error_broadcast_tx')}. ${t('error_broadcast_tx_connection', {
						message: response.error.message,
					})}`,
				);
			}
			setIsLoading(false);
			return;
		}

		// save tags to metadata
		dispatch(updateMetaTxTags({ txId: rawTx.id, tags: transaction.tags }));
		// save Slashtags contact to metadata
		if (transaction.slashTagsUrl) {
			dispatch(
				addMetaTxSlashtagsUrl({
					txId: rawTx.id,
					url: transaction.slashTagsUrl,
				}),
			);
		}

		updateOnChainActivityList();
		setIsLoading(false);

		if (transaction.slashTagsUrl) {
			dispatch(updateLastPaidContacts(transaction.slashTagsUrl));
		}

		navigation.navigate('Success', {
			type: EActivityType.onchain,
			amount,
			txId: rawTx.id,
		});
	}, [rawTx, transaction, amount, onError, navigation, dispatch, t]);

	useEffect(() => {
		if (rawTx) {
			_broadcast().then();
		}
	}, [rawTx, _broadcast]);

	const feeSats = useMemo(() => {
		return getTotalFee({
			satsPerByte: transaction.satsPerByte,
			message: transaction.message,
		});
	}, [transaction.satsPerByte, transaction.message]);

	const runCreateTxMethods = useCallback((): void => {
		if (usesLightning) {
			createLightningTransaction().then();
		} else {
			createOnChainTransaction().then();
		}
	}, [usesLightning, createLightningTransaction, createOnChainTransaction]);

	const navigateToPin = useCallback(() => {
		navigation.navigate('PinCheck', {
			onSuccess: () => {
				navigation.pop();
				setIsLoading(true);
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
			const res = removeTxTag({ tag });
			if (res.isErr()) {
				console.log(res.error.message);
				showToast({
					type: 'warning',
					title: t('tag_remove_error_title'),
					description: t('tag_remove_error_description'),
				});
			}
		},
		[t],
	);

	const onSwipeToPay = useCallback(async () => {
		const warnings: string[] = [];
		setIsLoading(true);

		const { fiatValue: amountFiat } = getFiatDisplayValues({
			satoshis: amount,
			currency: 'USD',
			exchangeRates,
		});

		const { fiatValue: feeFiat } = getFiatDisplayValues({
			satoshis: feeSats,
			currency: 'USD',
			exchangeRates,
		});

		// amount > 50% of total balance
		if (usesLightning) {
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

		// Check if the user is setting the minimum fee given the current fee environment.
		if (
			!usesLightning &&
			transaction.satsPerByte &&
			// This check is to prevent situations where all values are set to 1sat/vbyte. Where setting 1sat/vbyte is perfectly fine.
			feeEstimates.minimum < feeEstimates.slow &&
			transaction.satsPerByte <= feeEstimates.minimum
		) {
			warnings.push('dialog5');
		}

		// fee > 50% of send amount
		if (!usesLightning && feeSats > amount / 2) {
			warnings.push('dialog3');
		}
		confirmPayment(warnings);
	}, [
		amount,
		exchangeRates,
		feeSats,
		usesLightning,
		transaction.satsPerByte,
		enableSendAmountWarning,
		feeEstimates.minimum,
		feeEstimates.slow,
		confirmPayment,
		lightningBalance.localBalance,
		onChainBalance,
	]);

	const goToAddress = (): void => {
		navigation.navigate('Address', { uri });
	};

	const goBackToAmount = useCallback(() => {
		const { routes } = navigation.getState();
		const amountIndex = routes.findLastIndex(
			(route) => route.name === 'Amount',
		);

		if (amountIndex === -1) {
			console.error('Amount screen not found');
			return;
		}

		navigation.pop(routes.length - amountIndex - 1);
	}, [navigation]);

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
						color="secondary"
						width={16}
						height={16}
					/>
				);
		}
	}, [selectedFeeId]);

	const invoiceExpiryTimestamp = new Date(
		new Date().getTime() + decodedInvoice?.expiry_time! * 1000,
	);

	return (
		<>
			<GradientView style={styles.container}>
				<BottomSheetNavigationHeader title={t('send_review')} />
				<BottomSheetScrollView
					contentContainerStyle={styles.content}
					bounces={false}>
					<AmountToggle
						style={styles.amountToggle}
						amount={amount}
						testID="ReviewAmount"
						onPress={goBackToAmount}
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
									<BodySSB testID="ReviewUri" onPress={goToAddress}>
										{ellipsis(uri, 30)}
									</BodySSB>
								)
							}
						/>
					</View>

					{!usesLightning ? (
						<View style={styles.sectionContainer}>
							<Section
								title={t('send_fee_and_speed')}
								onPress={(): void => navigation.navigate('FeeRate')}
								value={
									<View style={styles.fee}>
										{feeIcon}
										<BodySSB>{t(`fee:${selectedFeeId}.title`)} (</BodySSB>
										<Money
											sats={feeSats}
											size="bodySSB"
											symbol={true}
											symbolColor="primary"
										/>
										<BodySSB>)</BodySSB>
										<PencilIcon height={12} width={22} />
									</View>
								}
							/>
							<Section
								title={t('send_confirming_in')}
								onPress={(): void => navigation.navigate('FeeRate')}
								value={
									<>
										<ClockIcon style={styles.icon} color="brand" />
										<BodySSB>{feeDescription}</BodySSB>
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
										<LightningHollow
											style={styles.icon}
											color="purple"
											height={16}
											width={16}
										/>
										<BodySSB>{FeeText.instant.title} (±$0.01)</BodySSB>
									</>
								}
							/>
							{decodedInvoice?.expiry_time && (
								<Section
									title={t('send_invoice_expiration')}
									value={
										<>
											<ClockIcon style={styles.icon} color="purple" />
											<BodySSB>
												{tTime('dateTime', {
													v: invoiceExpiryTimestamp,
													formatParams: {
														v: {
															month: 'short',
															day: 'numeric',
															hour: 'numeric',
															minute: 'numeric',
														},
													},
												})}
											</BodySSB>
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
								value={
									<BodySSB>{truncate(decodedInvoice.description, 100)}</BodySSB>
								}
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
												onDelete={(): void => handleTagRemove(tag)}
											/>
										))}
									</View>
									<View style={styles.tagsContainer}>
										<Button
											color="white06"
											text={t('tags_add')}
											icon={<TagIcon color="brand" width={16} />}
											testID="TagsAddSend"
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

					<View style={styles.buttonContainer}>
						<SwipeToConfirm
							text={t('send_swipe')}
							icon={<Checkmark width={30} height={30} color="black" />}
							loading={isLoading}
							confirmed={isLoading}
							onConfirm={onSwipeToPay}
						/>
					</View>

					<SafeAreaInset type="bottom" minPadding={16} />
				</BottomSheetScrollView>
			</GradientView>

			<Dialog
				visible={showDialog1}
				title={t('are_you_sure')}
				description={t('send_dialog1')}
				confirmText={t('send_yes')}
				visibleTestID="SendDialog1"
				onHide={(): void => confirmPayment(dialogWarnings)}
				onConfirm={(): void => setShowDialog1(false)}
				onCancel={(): void => {
					setShowDialog1(false);
					setIsLoading(false);
					setTimeout(() => navigation.goBack(), 300);
				}}
			/>
			<Dialog
				visible={showDialog2}
				title={t('are_you_sure')}
				description={t('send_dialog2')}
				confirmText={t('send_yes')}
				visibleTestID="SendDialog2"
				onHide={(): void => confirmPayment(dialogWarnings)}
				onConfirm={(): void => setShowDialog2(false)}
				onCancel={(): void => {
					setShowDialog2(false);
					setIsLoading(false);
					setTimeout(() => navigation.goBack(), 300);
				}}
			/>
			<Dialog
				visible={showDialog3}
				title={t('are_you_sure')}
				description={t('send_dialog3')}
				confirmText={t('send_yes')}
				visibleTestID="SendDialog3"
				onHide={(): void => confirmPayment(dialogWarnings)}
				onConfirm={(): void => setShowDialog3(false)}
				onCancel={(): void => {
					setShowDialog3(false);
					setIsLoading(false);
					setTimeout(() => navigation.goBack(), 300);
				}}
			/>
			<Dialog
				visible={showDialog4}
				title={t('are_you_sure')}
				description={t('send_dialog4')}
				confirmText={t('send_yes')}
				visibleTestID="SendDialog4"
				onHide={(): void => confirmPayment(dialogWarnings)}
				onConfirm={(): void => setShowDialog4(false)}
				onCancel={(): void => {
					setShowDialog4(false);
					setIsLoading(false);
					setTimeout(() => navigation.goBack(), 300);
				}}
			/>
			<Dialog
				visible={showDialog5}
				title={t('send_dialog5_title')}
				description={t('send_dialog5_description', {
					minimumFee: feeEstimates.minimum,
				})}
				confirmText={t('continue')}
				visibleTestID="SendDialog5"
				onHide={(): void => confirmPayment(dialogWarnings)}
				onConfirm={(): void => setShowDialog5(false)}
				onCancel={(): void => {
					setShowDialog5(false);
					setIsLoading(false);
					setTimeout(() => navigation.goBack(), 300);
				}}
			/>

			{showBiotmetrics && (
				<Biometrics
					onSuccess={(): void => {
						setIsLoading(true);
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

			{transaction.lightningInvoice && (
				<LightningSyncing style={styles.syncing} title={t('send_review')} />
			)}
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		// flex: 1,
		flexGrow: 1,
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
	buttonContainer: {
		marginTop: 'auto',
	},
	fee: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	syncing: {
		...StyleSheet.absoluteFillObject,
	},
});

export default memo(ReviewAndSend);
