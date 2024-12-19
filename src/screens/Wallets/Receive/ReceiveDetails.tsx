import React, { ReactElement, memo, useState, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedView, BottomSheetTextInput } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import { TagIcon } from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import Tag from '../../../components/Tag';
import { updateInvoice, removeInvoiceTag } from '../../../store/slices/receive';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import GradientView from '../../../components/GradientView';
import ReceiveNumberPad from './ReceiveNumberPad';
import UnitButton from '../UnitButton';
import { ReceiveScreenProps } from '../../../navigation/types';
import { receiveSelector } from '../../../store/reselect/receive';
import { useTransfer } from '../../../hooks/transfer';
import { useSwitchUnit } from '../../../hooks/wallet';
import { useScreenSize } from '../../../hooks/screen';
import { getNumberPadText } from '../../../utils/numberpad';
import { useLightningBalance } from '../../../hooks/lightning';
import {
	updatePendingInvoice,
	deletePendingInvoice,
} from '../../../store/slices/metadata';
import { estimateOrderFee } from '../../../utils/blocktank';
import { isGeoBlockedSelector } from '../../../store/reselect/user';
import {
	denominationSelector,
	nextUnitSelector,
} from '../../../store/reselect/settings';

const imageSrc = require('../../../assets/illustrations/coin-stack.png');

const ReceiveDetails = ({
	navigation,
	route,
}: ReceiveScreenProps<'ReceiveDetails'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { keyboardShown } = useKeyboard();
	const { isSmallScreen } = useScreenSize();
	const switchUnit = useSwitchUnit();
	const [showNumberPad, setShowNumberPad] = useState(false);
	const dispatch = useAppDispatch();
	const invoice = useAppSelector(receiveSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const { receiveAddress, lightningInvoice, enableInstant } = route.params;
	const lightningBalance = useLightningBalance(false);
	const isGeoBlocked = useAppSelector(isGeoBlockedSelector);
	const [minimumAmount, setMinimumAmount] = useState(0);

	const { maxClientBalance, defaultLspBalance: lspBalance } = useTransfer(0);

	useEffect(() => {
		// The minimum amount is the fee for the channel plus a buffer
		const getFeeEstimation = async (): Promise<void> => {
			const feeResult = await estimateOrderFee({ lspBalance });
			if (feeResult.isOk()) {
				const fees = feeResult.value;
				// add 10% buffer and round up to the nearest 1000 to avoid fee fluctuations
				const minimum = Math.ceil((fees.feeSat * 1.1) / 1000) * 1000;
				setMinimumAmount(minimum);
			}
		};

		getFeeEstimation();
	}, [lspBalance]);

	useEffect(() => {
		if (invoice.tags.length > 0) {
			dispatch(
				updatePendingInvoice({
					id: invoice.id,
					tags: invoice.tags,
					address: receiveAddress,
					payReq: lightningInvoice,
				}),
			);
		} else {
			dispatch(deletePendingInvoice(invoice.id));
		}
	}, [invoice.id, invoice.tags, receiveAddress, lightningInvoice, dispatch]);

	// Determine if CJIT flow should be shown
	const showCjitIfNeeded = (): void => {
		// Return if:
		if (
			// instant payments are disabled
			!enableInstant ||
			// user is geo-blocked
			isGeoBlocked ||
			// failed to get minimum amount
			minimumAmount === 0 ||
			// there is enough inbound capacity
			invoice.amount <= lightningBalance.remoteBalance ||
			// amount is less than minimum CJIT amount
			invoice.amount >= minimumAmount ||
			// amount is below the maximum client balance
			invoice.amount <= maxClientBalance
		) {
			return;
		}

		navigation.navigate('ReceiveConnect', { isAdditional: true });
	};

	const onChangeUnit = (): void => {
		const result = getNumberPadText(invoice.amount, denomination, nextUnit);
		dispatch(updateInvoice({ numberPadText: result }));
		switchUnit();
	};

	const onNumberPadPress = (): void => {
		if (showNumberPad) {
			onChangeUnit();
		} else {
			setShowNumberPad(true);
		}
	};

	const onNavigateBack = async (): Promise<void> => {
		await Keyboard.dismiss();
		navigation.navigate('ReceiveQR');
	};

	const onContinue = (): void => {
		showCjitIfNeeded();
		setShowNumberPad(false);
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('receive_specify')}
				showBackButton={false}
			/>
			<View style={styles.content}>
				<NumberPadTextField
					value={invoice.numberPadText}
					showPlaceholder={showNumberPad}
					testID="ReceiveNumberPadTextField"
					onPress={onNumberPadPress}
				/>

				{!showNumberPad && (
					<>
						<View style={styles.inputContainer}>
							<Caption13Up style={styles.label} color="secondary">
								{t('note')}
							</Caption13Up>
							<View style={styles.inputWrapper}>
								<BottomSheetTextInput
									style={styles.input}
									value={invoice.message}
									placeholder={t('receive_note_placeholder')}
									selectTextOnFocus={true}
									multiline={true}
									autoCapitalize="none"
									autoCorrect={false}
									blurOnSubmit={true}
									returnKeyType="done"
									testID="ReceiveNote"
									onChangeText={(txt): void => {
										dispatch(updateInvoice({ message: txt }));
									}}
								/>
							</View>
						</View>

						{!keyboardShown && (
							<AnimatedView
								style={styles.bottom}
								color="transparent"
								entering={FadeIn}
								exiting={FadeOut}>
								<Caption13Up style={styles.label} color="secondary">
									{t('tags')}
								</Caption13Up>
								<View style={styles.tagsContainer}>
									{invoice.tags.map((tag) => (
										<Tag
											key={tag}
											style={styles.tag}
											value={tag}
											onDelete={(): void => {
												dispatch(removeInvoiceTag(tag));
											}}
										/>
									))}
								</View>
								<View style={styles.tagsContainer}>
									<Button
										color="white06"
										text={t('tags_add')}
										icon={<TagIcon color="brand" width={16} />}
										testID="TagsAdd"
										onPress={(): void => navigation.navigate('Tags')}
									/>
								</View>

								{!isSmallScreen && (
									<View style={styles.imageContainer}>
										<Image style={styles.image} source={imageSrc} />
									</View>
								)}
							</AnimatedView>
						)}

						<View style={styles.buttonContainer}>
							<Button
								size="large"
								text={t('receive_show_qr')}
								testID="ShowQrReceive"
								onPress={onNavigateBack}
							/>
						</View>
					</>
				)}

				{showNumberPad && (
					<View style={styles.numberPad} testID="ReceiveNumberPad">
						<View style={styles.actions}>
							<View style={styles.actionButtons}>
								<View style={styles.actionButtonContainer}>
									<UnitButton
										testID="ReceiveNumberPadUnit"
										onPress={onChangeUnit}
									/>
								</View>
							</View>
						</View>

						<ReceiveNumberPad />

						<View style={styles.buttonContainer}>
							<Button
								size="large"
								text={t('continue')}
								testID="ReceiveNumberPadSubmit"
								onPress={onContinue}
							/>
						</View>
					</View>
				)}
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
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
	label: {
		marginBottom: 8,
	},
	inputContainer: {
		marginTop: 28,
	},
	inputWrapper: {
		marginBottom: 16,
		position: 'relative',
	},
	input: {
		minHeight: 85,
	},
	actions: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginBottom: 5,
		paddingBottom: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
	},
	numberPad: {
		flex: 1,
		marginTop: 'auto',
		maxHeight: 450,
	},
	actionButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginLeft: 'auto',
	},
	actionButtonContainer: {
		alignItems: 'center',
	},
	bottom: {
		flex: 1,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
	imageContainer: {
		alignSelf: 'center',
		alignItems: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
		position: 'absolute',
		// bottom: 0,
		bottom: -30,
		// left: 0,
		// right: 0,
		zIndex: -1,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ReceiveDetails);
