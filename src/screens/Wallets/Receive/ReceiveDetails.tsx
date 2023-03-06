import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
	AnimatedView,
	BottomSheetTextInput,
	TouchableOpacity,
} from '../../../styles/components';
import { Caption13Up, Text02B } from '../../../styles/text';
import { SwitchIcon, TagIcon } from '../../../styles/icons';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import AmountToggle from '../../../components/AmountToggle';
import Button from '../../../components/Button';
import Tag from '../../../components/Tag';
import {
	updateInvoice,
	removeInvoiceTag,
} from '../../../store/actions/receive';
import useKeyboard, { Keyboard } from '../../../hooks/keyboard';
import GradientView from '../../../components/GradientView';
import ReceiveNumberPad from './ReceiveNumberPad';
import useDisplayValues from '../../../hooks/displayValues';
import { ReceiveScreenProps } from '../../../navigation/types';
import { EBitcoinUnit } from '../../../store/types/wallet';
import { updateSettings } from '../../../store/actions/settings';
import { receiveSelector } from '../../../store/reselect/receive';
import {
	bitcoinUnitSelector,
	unitPreferenceSelector,
} from '../../../store/reselect/settings';
import GlowImage from '../../../components/GlowImage';
import { useScreenSize } from '../../../hooks/screen';

const imageSrc = require('../../../assets/illustrations/coin-stack-4.png');

const ReceiveDetails = ({
	navigation,
}: ReceiveScreenProps<'ReceiveDetails'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const insets = useSafeAreaInsets();
	const { keyboardShown } = useKeyboard();
	const { isSmallScreen } = useScreenSize();
	const [isInputFocused, setIsInputFocused] = useState(false);
	const [showNumberPad, setShowNumberPad] = useState(false);
	const invoice = useSelector(receiveSelector);
	const bitcoinUnit = useSelector(bitcoinUnitSelector);
	const unitPreference = useSelector(unitPreferenceSelector);
	const displayValues = useDisplayValues(invoice.amount);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			// extra padding needed because of KeyboardAvoidingView
			paddingBottom: keyboardShown
				? Platform.OS === 'ios'
					? 16
					: 40
				: insets.bottom + 16,
		}),
		[keyboardShown, insets.bottom],
	);

	// BTC -> satoshi -> fiat
	const nextUnit = useMemo(() => {
		if (unitPreference === 'asset') {
			return bitcoinUnit === EBitcoinUnit.BTC ? EBitcoinUnit.satoshi : 'fiat';
		}
		return EBitcoinUnit.BTC;
	}, [bitcoinUnit, unitPreference]);

	const onChangeUnit = (): void => {
		updateSettings({
			unitPreference: nextUnit === 'fiat' ? 'fiat' : 'asset',
			...(nextUnit !== 'fiat' && { bitcoinUnit: nextUnit }),
		});
	};

	const onNavigateBack = useCallback(async () => {
		await Keyboard.dismiss();
		navigation.navigate('Receive');
	}, [navigation]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('receive_specify')}
				displayBackButton={false}
			/>
			<View style={styles.content}>
				<AmountToggle
					sats={invoice.amount}
					reverse={true}
					space={16}
					onPress={(): void => setShowNumberPad(true)}
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
									onFocus={(): void => setIsInputFocused(true)}
									onBlur={(): void => setIsInputFocused(false)}
									onChangeText={(txt): void => {
										updateInvoice({ message: txt });
									}}
								/>
							</View>
						</View>

						{!keyboardShown && !isInputFocused && (
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
											onClose={(): void => {
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
										onPress={(): void => {
											navigation.navigate('Tags');
										}}
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

						<View style={buttonContainerStyles}>
							<Button
								size="large"
								text={t('receive_show_qr')}
								onPress={onNavigateBack}
							/>
						</View>
					</>
				)}

				{showNumberPad && (
					<View style={styles.numberPad}>
						<View style={styles.actions}>
							<View style={styles.actionButtons}>
								<View style={styles.actionButtonContainer}>
									<TouchableOpacity
										style={styles.actionButton}
										color="white08"
										onPress={onChangeUnit}>
										<SwitchIcon color="brand" width={16.44} height={13.22} />
										<Text02B
											style={styles.actionButtonText}
											size="12px"
											color="brand">
											{nextUnit === 'BTC' && 'BTC'}
											{nextUnit === 'satoshi' && 'sats'}
											{nextUnit === 'fiat' && displayValues.fiatTicker}
										</Text02B>
									</TouchableOpacity>
								</View>
							</View>
						</View>

						<ReceiveNumberPad />

						<View style={buttonContainerStyles}>
							<Button
								size="large"
								text={t('continue')}
								onPress={(): void => setShowNumberPad(false)}
							/>
						</View>
					</View>
				)}
			</View>
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
		maxHeight: 500,
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
