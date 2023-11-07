import React, {
	ReactElement,
	memo,
	useCallback,
	useState,
	useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import {
	AnimatedView,
	BottomSheetTextInput,
	TouchableOpacity,
} from '../../../styles/components';
import { Caption13Up, Text02B } from '../../../styles/text';
import { SwitchIcon, TagIcon } from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
import {
	updateInvoice,
	removeInvoiceTag,
} from '../../../store/actions/receive';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import GradientView from '../../../components/GradientView';
import ReceiveNumberPad from './ReceiveNumberPad';
import { useCurrency } from '../../../hooks/displayValues';
import { ReceiveScreenProps } from '../../../navigation/types';
import { receiveSelector } from '../../../store/reselect/receive';
import GlowImage from '../../../components/GlowImage';
import { useScreenSize } from '../../../hooks/screen';
import { getNumberPadText } from '../../../utils/numberpad';
import { useSwitchUnit } from '../../../hooks/wallet';
import {
	removePendingInvoice,
	updatePendingInvoice,
} from '../../../store/actions/metadata';
import { createCJitEntry } from '../../../utils/blocktank';
import { DEFAULT_CHANNEL_DURATION } from '../../Lightning/CustomConfirm';
import { blocktankInfoSelector } from '../../../store/reselect/blocktank';
import { isGeoBlockedSelector } from '../../../store/reselect/user';
import { useLightningBalance } from '../../../hooks/lightning';
import { lightningSelector } from '../../../store/reselect/lightning';

const imageSrc = require('../../../assets/illustrations/coin-stack-4.png');

// hardcoded to be above fee (1092)
// TODO: fee is dynamic so this should be fetched from the API
const MINIMUM_AMOUNT = 5000;

const ReceiveDetails = ({
	navigation,
	route,
}: ReceiveScreenProps<'ReceiveDetails'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { keyboardShown } = useKeyboard();
	const { isSmallScreen } = useScreenSize();
	const [nextUnit, switchUnit] = useSwitchUnit();
	const [showNumberPad, setShowNumberPad] = useState(false);
	const invoice = useSelector(receiveSelector);
	const { fiatTicker } = useCurrency();
	const { receiveAddress, lightningInvoice, enableInstant } = route.params;
	const blocktank = useSelector(blocktankInfoSelector);
	const lightningBalance = useLightningBalance(false);
	const isGeoBlocked = useSelector(isGeoBlockedSelector);
	const lightning = useSelector(lightningSelector);

	const { maxChannelSizeSat } = blocktank.options;

	const onChangeUnit = (): void => {
		const result = getNumberPadText(invoice.amount, nextUnit);
		updateInvoice({ numberPadText: result });
		switchUnit();
	};

	// Determines if a CJIT entry can and should be created for the given invoice.
	const createCJitIfNeeded = useCallback(async () => {
		// Return if geo-blocked or if we have a large enough remote balance to satisfy the invoice.
		if (
			!enableInstant ||
			isGeoBlocked ||
			lightningBalance.remoteBalance >= invoice.amount ||
			lightning.accountVersion < 2
		) {
			return;
		}

		// channel size must be at least 2x the invoice amount
		const maxAmount = maxChannelSizeSat / 2;

		// Ensure the CJIT entry is within an acceptable range.
		if (invoice.amount >= MINIMUM_AMOUNT && invoice.amount <= maxAmount) {
			const cJitEntryResponse = await createCJitEntry({
				channelSizeSat: maxChannelSizeSat,
				invoiceSat: invoice.amount,
				invoiceDescription: invoice.message,
				channelExpiryWeeks: DEFAULT_CHANNEL_DURATION,
				couponCode: 'bitkit',
			});
			if (cJitEntryResponse.isErr()) {
				console.log({ error: cJitEntryResponse.error.message });
				return;
			}
			const order = cJitEntryResponse.value;
			updateInvoice({ jitOrder: order });
			navigation.navigate('ReceiveConnect');
		}
	}, [
		maxChannelSizeSat,
		enableInstant,
		invoice.amount,
		invoice.message,
		isGeoBlocked,
		lightning.accountVersion,
		lightningBalance.remoteBalance,
		navigation,
	]);

	const onNavigateBack = useCallback(async () => {
		await Keyboard.dismiss();
		navigation.navigate('ReceiveQR');
	}, [navigation]);

	const onContinue = useCallback(async () => {
		await createCJitIfNeeded();
		setShowNumberPad(false);
	}, [createCJitIfNeeded]);

	const onNumberPadPress = (): void => {
		if (showNumberPad) {
			onChangeUnit();
		} else {
			setShowNumberPad(true);
		}
	};

	useEffect(() => {
		if (invoice.tags.length > 0) {
			updatePendingInvoice({
				id: invoice.id,
				tags: invoice.tags,
				address: receiveAddress,
				payReq: lightningInvoice,
			});
		} else {
			removePendingInvoice(invoice.id);
		}
	}, [invoice.id, invoice.tags, receiveAddress, lightningInvoice]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('receive_specify')}
				displayBackButton={false}
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
							<Caption13Up style={styles.label} color="gray1">
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
										updateInvoice({ message: txt });
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
								<Caption13Up style={styles.label} color="gray1">
									{t('tags')}
								</Caption13Up>
								<View style={styles.tagsContainer}>
									{invoice.tags.map((tag) => (
										<Tag
											key={tag}
											style={styles.tag}
											value={tag}
											onDelete={(): void => {
												removeInvoiceTag({ tag });
											}}
										/>
									))}
								</View>
								<View style={styles.tagsContainer}>
									<Button
										color="white04"
										text={t('tags_add')}
										icon={<TagIcon color="brand" width={16} />}
										testID="TagsAdd"
										onPress={(): void => navigation.navigate('Tags')}
									/>
								</View>

								{!isSmallScreen && (
									<GlowImage
										style={styles.image}
										image={imageSrc}
										glowColor="white3"
									/>
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
									<TouchableOpacity
										style={styles.actionButton}
										color="white08"
										testID="ReceiveNumberPadUnit"
										onPress={onChangeUnit}>
										<SwitchIcon color="brand" width={16.44} height={13.22} />
										<Text02B
											style={styles.actionButtonText}
											size="12px"
											color="brand">
											{nextUnit === 'BTC' && 'BTC'}
											{nextUnit === 'satoshi' && 'sats'}
											{nextUnit === 'fiat' && fiatTicker}
										</Text02B>
									</TouchableOpacity>
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
	actionButton: {
		marginLeft: 16,
		paddingVertical: 7,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionButtonText: {
		marginLeft: 11,
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
	image: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: -1,
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ReceiveDetails);
