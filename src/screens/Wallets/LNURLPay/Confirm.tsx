import React, {
	ReactElement,
	ReactNode,
	memo,
	useCallback,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import AmountToggle from '../../../components/AmountToggle';
import Biometrics from '../../../components/Biometrics';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import LightningSyncing from '../../../components/LightningSyncing';
import SafeAreaInset from '../../../components/SafeAreaInset';
import SwipeToConfirm from '../../../components/SwipeToConfirm';
import useColors from '../../../hooks/colors';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import type { SendScreenProps } from '../../../navigation/types';
import {
	pinForPaymentsSelector,
	pinSelector,
	settingsSelector,
} from '../../../store/reselect/settings';
import { addPendingPayment } from '../../../store/slices/lightning';
import { updateMetaTxComment } from '../../../store/slices/metadata';
import { EActivityType } from '../../../store/types/activity';
import { BottomSheetTextInput } from '../../../styles/components';
import { Checkmark, LightningHollowIcon } from '../../../styles/icons';
import { BodySSB, Caption13Up } from '../../../styles/text';
import { FeeText } from '../../../utils/fees';
import {
	decodeLightningInvoice,
	payLightningInvoice,
} from '../../../utils/lightning';
import { handleLnurlPay } from '../../../utils/lnurl';

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

const LNURLConfirm = ({
	navigation,
	route,
}: SendScreenProps<'LNURLConfirm'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { amount, pParams, url } = route.params;
	const { keyboardShown } = useKeyboard();
	const dispatch = useAppDispatch();
	const pin = useAppSelector(pinSelector);
	const pinForPayments = useAppSelector(pinForPaymentsSelector);
	const { biometrics } = useAppSelector(settingsSelector);
	const [isLoading, setIsLoading] = useState(false);
	const [showBiotmetrics, setShowBiometrics] = useState(false);
	const [comment, setComment] = useState('');

	const onError = useCallback(
		(errorMessage: string) => {
			navigation.navigate('Error', { errorMessage });
		},
		[navigation],
	);

	const handlePay = useCallback(async () => {
		setIsLoading(true);
		const invoice = await handleLnurlPay({
			params: pParams,
			amountSats: amount,
			comment,
		});

		if (invoice.isErr()) {
			setIsLoading(false);
			return;
		}

		const decodeInvoiceResponse = await decodeLightningInvoice(invoice.value);
		if (decodeInvoiceResponse.isErr()) {
			setIsLoading(false);
			onError(decodeInvoiceResponse.error.message);
			return;
		}
		const decodedInvoice = decodeInvoiceResponse.value;

		const payInvoiceResponse = await payLightningInvoice({
			invoice: invoice.value,
		});

		setIsLoading(false);

		if (comment) {
			dispatch(
				updateMetaTxComment({
					txId: decodedInvoice.payment_hash,
					comment,
				}),
			);
		}

		if (payInvoiceResponse.isErr()) {
			const errorMessage = payInvoiceResponse.error.message;
			if (errorMessage === 'Timed Out.') {
				dispatch(
					addPendingPayment({
						payment_hash: decodedInvoice.payment_hash,
						amount,
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
	}, [t, amount, comment, dispatch, navigation, onError, pParams]);

	const navigateToPin = useCallback(() => {
		navigation.navigate('PinCheck', {
			onSuccess: () => {
				navigation.pop();
				setIsLoading(true);
				handlePay();
			},
		});
	}, [navigation, handlePay]);

	const onSwipeToPay = useCallback(() => {
		setIsLoading(true);

		if (pin && pinForPayments) {
			if (biometrics) {
				setShowBiometrics(true);
			} else {
				setIsLoading(false);
				navigateToPin();
			}
		} else {
			handlePay();
		}
	}, [pin, pinForPayments, biometrics, handlePay, navigateToPin]);

	const handleGoBack = useCallback(async () => {
		// make sure Keyboard is closed before navigating back to prevent layout bugs
		await Keyboard.dismiss();
		navigation.goBack();
	}, [navigation]);

	const fixedAmount = pParams.minSendable === pParams.maxSendable;

	return (
		<>
			<GradientView style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('lnurl_p_title')}
					showBackButton={!fixedAmount}
				/>
				<View style={styles.content}>
					<AmountToggle
						style={styles.amountToggle}
						amount={amount}
						onPress={fixedAmount ? undefined : handleGoBack}
					/>

					{!keyboardShown && (
						<Animated.View
							style={styles.sectionContainer}
							entering={FadeIn}
							exiting={FadeOut}>
							<Section
								title={t('send_invoice')}
								value={
									<BodySSB numberOfLines={1} ellipsizeMode="middle">
										{url}
									</BodySSB>
								}
							/>
						</Animated.View>
					)}

					{!keyboardShown && (
						<Animated.View
							style={styles.sectionContainer}
							entering={FadeIn}
							exiting={FadeOut}>
							<Section
								title={t('send_fee_and_speed')}
								value={
									<>
										<LightningHollowIcon
											style={styles.icon}
											color="purple"
											height={16}
											width={16}
										/>
										<BodySSB>{FeeText.instant.title} (±$0.01)</BodySSB>
									</>
								}
							/>
						</Animated.View>
					)}

					{pParams.commentAllowed > 0 && (
						<View style={styles.sectionContainer}>
							<Section
								title={t('lnurl_pay_confirm.comment')}
								value={
									<View style={styles.textContainer}>
										<BottomSheetTextInput
											value={comment}
											placeholder={t('lnurl_pay_confirm.comment_placeholder')}
											returnKeyType="done"
											multiline={true}
											minHeight={100}
											maxLength={pParams.commentAllowed}
											blurOnSubmit={true}
											testID="CommentInput"
											onChangeText={setComment}
										/>
									</View>
								}
							/>
						</View>
					)}

					<View style={styles.buttonContainer}>
						<SwipeToConfirm
							text={t('send_swipe')}
							icon={<Checkmark width={30} height={30} color="black" />}
							loading={isLoading}
							confirmed={isLoading}
							onConfirm={onSwipeToPay}
						/>
					</View>
				</View>

				<SafeAreaInset type="bottom" minPadding={16} />
			</GradientView>

			{showBiotmetrics && (
				<Biometrics
					onSuccess={(): void => {
						setIsLoading(true);
						setShowBiometrics(false);
						handlePay();
					}}
					onFailure={(): void => {
						setIsLoading(false);
						setShowBiometrics(false);
						navigateToPin();
					}}
				/>
			)}

			<LightningSyncing style={styles.syncing} title={t('send_review')} />
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
		alignContent: 'center',
		justifyContent: 'center',
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
	buttonContainer: {
		marginTop: 'auto',
	},
	icon: {
		marginRight: 6,
	},
	amountToggle: {
		marginBottom: 32,
	},
	textContainer: {
		flex: 1,
	},
	syncing: {
		...StyleSheet.absoluteFillObject,
	},
});

export default memo(LNURLConfirm);
