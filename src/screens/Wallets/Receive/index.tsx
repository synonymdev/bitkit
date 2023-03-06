import React, {
	memo,
	ReactElement,
	useMemo,
	useState,
	useEffect,
	useRef,
	useCallback,
} from 'react';
import { useSelector } from 'react-redux';
import {
	ActivityIndicator,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { FadeIn, useSharedValue } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { useTranslation } from 'react-i18next';

import {
	View as ThemedView,
	TouchableOpacity,
	AnimatedView,
} from '../../../styles/components';
import {
	BitcoinSlantedIcon,
	CopyIcon,
	LightningIcon,
	ShareIcon,
} from '../../../styles/icons';
import { Caption13Up, Text02S } from '../../../styles/text';
import { resetInvoice } from '../../../store/actions/receive';
import { updateMetaIncTxTags } from '../../../store/actions/metadata';
import { createLightningInvoice } from '../../../store/actions/lightning';
import { generateNewReceiveAddress } from '../../../store/actions/wallet';
import { viewControllerIsOpenSelector } from '../../../store/reselect/ui';
import { useLightningBalance } from '../../../hooks/lightning';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { refreshLdk } from '../../../utils/lightning';
import { getUnifiedUri } from '../../../utils/receive';
import { ellipse, sleep } from '../../../utils/helpers';
import { getReceiveAddress } from '../../../utils/wallet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Button from '../../../components/Button';
import Tooltip from '../../../components/Tooltip';
import Dot from '../../../components/SliderDots';
import {
	addressTypeSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { receiveSelector } from '../../../store/reselect/receive';
import { ReceiveScreenProps } from '../../../navigation/types';
import BitcoinLogo from '../../../assets/bitcoin-logo-small.svg';

type Slide = {
	slide: () => ReactElement;
};

const defaultTooltips = {
	unified: false,
	onchain: false,
	lightning: false,
};

const QrIcon = memo(
	(): ReactElement => {
		return (
			<View style={styles.qrIconContainer}>
				<View style={styles.qrIcon}>
					<BitcoinLogo />
				</View>
			</View>
		);
	},
	() => true,
);

const Receive = ({
	navigation,
}: ReceiveScreenProps<'Receive'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const progressValue = useSharedValue(0);
	const carouselRef = useRef<ICarouselInstance>(null);
	const qrRef = useRef<string>();

	const [loading, setLoading] = useState(true);
	const [receiveAddress, setReceiveAddress] = useState('');
	const [lightningInvoice, setLightningInvoice] = useState('');
	const [showTooltip, setShowTooltip] = useState(defaultTooltips);
	const [isSharing, setIsSharing] = useState(false);

	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const addressType = useSelector(addressTypeSelector);
	const { amount, message, tags } = useSelector(receiveSelector);
	const lightningBalance = useLightningBalance(false);
	const receiveNavigationIsOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'receiveNavigation'),
	);

	useBottomSheetBackPress('receiveNavigation');

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const getLightningInvoice = useCallback(async (): Promise<void> => {
		if (
			!receiveNavigationIsOpen ||
			!lightningBalance.remoteBalance ||
			lightningBalance.remoteBalance < amount
		) {
			return;
		}

		const response = await createLightningInvoice({
			amountSats: amount,
			description: message,
			expiryDeltaSeconds: 3600,
			selectedNetwork,
			selectedWallet,
		});

		if (response.isErr()) {
			console.log(response.error.message);
			return;
		}

		setLightningInvoice(response.value.to_str);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amount, message]);

	const getAddress = useCallback(async (): Promise<void> => {
		if (!receiveNavigationIsOpen) {
			return;
		}
		if (amount > 0) {
			console.info('getting fresh address');
			const response = await generateNewReceiveAddress({
				selectedNetwork,
				selectedWallet,
				addressType,
			});
			if (response.isOk()) {
				console.info(`generated fresh address ${response.value.address}`);
				setReceiveAddress(response.value.address);
			}
		} else {
			const response = await getReceiveAddress({
				selectedNetwork,
				selectedWallet,
				addressType,
			});
			if (response.isOk()) {
				console.info(`reusing address ${response.value}`);
				setReceiveAddress(response.value);
			}
		}
	}, [
		amount,
		receiveNavigationIsOpen,
		selectedNetwork,
		selectedWallet,
		addressType,
	]);

	const setInvoiceDetails = useCallback(async (): Promise<void> => {
		if (!receiveNavigationIsOpen) {
			return;
		}
		if (!loading) {
			setLoading(true);
		}
		// Gives the modal animation time to start.
		await sleep(50);
		await Promise.all([getLightningInvoice(), getAddress()]);
		setLoading(false);
	}, [getAddress, getLightningInvoice, loading, receiveNavigationIsOpen]);

	useEffect(() => {
		if (!receiveNavigationIsOpen) {
			return;
		}
		// Gives the modal animation time to start.
		sleep(50).then(() => {
			resetInvoice();
			// Only refresh LDK if we have a remote balance.
			if (lightningBalance.remoteBalance > 0) {
				refreshLdk({ selectedWallet, selectedNetwork }).then();
			}
		});
	}, [
		selectedNetwork,
		selectedWallet,
		receiveNavigationIsOpen,
		lightningBalance.remoteBalance,
	]);

	useEffect(() => {
		if (!receiveNavigationIsOpen) {
			return;
		}
		// Gives the modal animation time to start.
		sleep(50).then(() => {
			setInvoiceDetails().then();
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		amount,
		message,
		selectedNetwork,
		selectedWallet,
		receiveNavigationIsOpen,
	]);

	useEffect(() => {
		// Gives the modal animation time to start.
		sleep(50).then(() => {
			if (tags.length !== 0 && receiveAddress && receiveNavigationIsOpen) {
				updateMetaIncTxTags(receiveAddress, lightningInvoice, tags);
			}
		});
	}, [receiveAddress, lightningInvoice, tags, receiveNavigationIsOpen]);

	const uri = useMemo((): string => {
		if (!receiveNavigationIsOpen) {
			return '';
		}
		return getUnifiedUri({
			address: receiveAddress,
			amount,
			label: message,
			message,
			lightning: lightningInvoice,
		});
	}, [
		amount,
		lightningInvoice,
		message,
		receiveAddress,
		receiveNavigationIsOpen,
	]);

	const handleCopy = (text: string, id: string): void => {
		Clipboard.setString(text);
		setShowTooltip((prevState) => ({ ...prevState, [id]: true }));
		setTimeout(() => setShowTooltip(defaultTooltips), 1500);
	};

	const handleCopyQrCode = useCallback((): void => {
		console.log('TODO: copy QR code as image');
		// not implemented in upstream yet
		// https://github.com/react-native-clipboard/clipboard/issues/6
		// qrRef.current.toDataURL((base64) => {
		// 	const image = `data:image/png;base64,${base64}`;
		// 	// Clipboard.setString(image);
		// });
	}, []);

	const handleShare = useCallback(
		async (text: string, imageData?: string): Promise<void> => {
			setIsSharing(true);

			try {
				if (imageData) {
					const image = `data:image/png;base64,${imageData}`;
					await Share.open({
						title: t('receive_share_address'),
						message: text,
						url: image,
						type: 'image/png',
					});
				} else {
					await Share.open({
						title: t('receive_share_address'),
						message: text,
					});
				}
			} catch (error) {
				console.log(error);
			} finally {
				setIsSharing(false);
			}
		},
		[t],
	);

	const qrMaxHeight = useMemo(
		() => dimensions.height / 2.5,
		[dimensions?.height],
	);
	const qrMaxWidth = useMemo(
		() => dimensions.width - 16 * 4,
		[dimensions?.width],
	);
	const qrSize = useMemo(
		() => Math.min(qrMaxWidth, qrMaxHeight),
		[qrMaxHeight, qrMaxWidth],
	);

	const Slide1 = useCallback((): ReactElement => {
		return (
			<View style={styles.slide}>
				<TouchableOpacity
					style={styles.qrCode}
					color="white"
					activeOpacity={1}
					onPress={(): void => handleCopy(uri, 'unified')}
					onLongPress={handleCopyQrCode}
					testID="QRCode"
					accessibilityLabel={uri}>
					<QRCode
						value={uri}
						size={qrSize}
						quietZone={16}
						getRef={(c): void => {
							if (c) {
								c.toDataURL((data: string) => (qrRef.current = data));
							}
						}}
					/>
					<QrIcon />
				</TouchableOpacity>
				<View style={styles.actions}>
					<Button
						style={styles.actionButton}
						icon={<CopyIcon width={18} color="brand" />}
						text={t('copy')}
						onPress={(): void => handleCopy(uri, 'unified')}
					/>
					<View style={styles.buttonSpacer} />
					<Button
						style={styles.actionButton}
						text={t('share')}
						icon={<ShareIcon width={18} color="brand" />}
						disabled={isSharing}
						onPress={(): void => {
							handleShare(uri, qrRef.current);
						}}
					/>
				</View>
			</View>
		);
	}, [uri, handleCopyQrCode, handleShare, isSharing, qrSize, t]);

	const Slide2 = useCallback((): ReactElement => {
		return (
			<View style={styles.slide}>
				<ThemedView style={styles.invoices} color="white04">
					<View style={styles.invoice}>
						<View style={styles.invoiceLabel}>
							<Caption13Up color="gray1">
								{t('receive_bitcoin_invoice')}
							</Caption13Up>
							<BitcoinSlantedIcon
								style={styles.invoiceLabelIcon}
								color="gray1"
								height={14}
								width={20}
							/>
						</View>
						<View style={styles.invoiceText}>
							<Text02S>{ellipse(receiveAddress, 35)}</Text02S>
							{showTooltip.onchain && (
								<AnimatedView
									style={styles.tooltip}
									color="transparent"
									entering={FadeIn}>
									<Tooltip text={t('receive_copied')} />
								</AnimatedView>
							)}
						</View>
						<View style={styles.actions}>
							<Button
								style={styles.actionButton}
								icon={<CopyIcon width={18} color="brand" />}
								text={t('copy')}
								onPress={(): void => {
									handleCopy(receiveAddress, 'onchain');
								}}
							/>
							<View style={styles.buttonSpacer} />
							<Button
								style={styles.actionButton}
								text={t('share')}
								icon={<ShareIcon width={18} color="brand" />}
								disabled={isSharing}
								onPress={(): void => {
									handleShare(receiveAddress);
								}}
							/>
						</View>
					</View>

					{lightningInvoice !== '' && (
						<>
							<View style={styles.divider} />
							<View style={styles.invoice}>
								<View style={styles.invoiceLabel}>
									<Caption13Up color="gray1">
										{t('receive_lightning_invoice')}
									</Caption13Up>
									<LightningIcon
										style={styles.invoiceLabelIcon}
										color="gray1"
										height={14}
										width={15}
									/>
								</View>
								<View style={styles.invoiceText}>
									<Text02S>{ellipse(lightningInvoice, 35)}</Text02S>
									{showTooltip.lightning && (
										<AnimatedView
											style={styles.tooltip}
											color="transparent"
											entering={FadeIn}>
											<Tooltip text={t('receive_copied')} />
										</AnimatedView>
									)}
								</View>
								<View style={styles.actions}>
									<Button
										style={styles.actionButton}
										icon={<CopyIcon width={18} color="brand" />}
										text={t('copy')}
										onPress={(): void => {
											handleCopy(lightningInvoice, 'lightning');
										}}
									/>
									<View style={styles.buttonSpacer} />
									<Button
										style={styles.actionButton}
										text={t('share')}
										icon={<ShareIcon width={18} color="brand" />}
										disabled={isSharing}
										onPress={(): void => {
											handleShare(lightningInvoice);
										}}
									/>
								</View>
							</View>
						</>
					)}
				</ThemedView>
			</View>
		);
	}, [
		lightningInvoice,
		receiveAddress,
		showTooltip,
		handleShare,
		isSharing,
		t,
	]);

	const slides = useMemo((): Slide[] => {
		return [{ slide: Slide1 }, { slide: Slide2 }];
	}, [Slide1, Slide2]);

	return (
		<View style={styles.container} testID="ReceiveScreen">
			<BottomSheetNavigationHeader
				title={t('receive_bitcoin')}
				displayBackButton={false}
			/>

			{loading && (
				<View style={[styles.loading, { height: qrSize }]}>
					<ActivityIndicator color="white" />
				</View>
			)}

			{!loading && (
				<View style={styles.carouselWrapper}>
					<Carousel
						ref={carouselRef}
						style={styles.carousel}
						data={slides}
						width={dimensions.width}
						height={qrMaxHeight + 110}
						loop={false}
						panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
						renderItem={({ index: i }): ReactElement => {
							const Slide = slides[i].slide;
							return <Slide key={i} />;
						}}
						onProgressChange={(_, absoluteProgress): void => {
							progressValue.value = absoluteProgress;
						}}
					/>
					<View style={styles.dots} pointerEvents="none">
						{slides.map((_slide, index) => (
							<Dot
								key={index}
								index={index}
								animValue={progressValue}
								length={slides.length}
							/>
						))}
					</View>

					{showTooltip.unified && (
						<AnimatedView
							style={styles.tooltipUnified}
							color="transparent"
							entering={FadeIn}>
							<Tooltip text={t('receive_copied')} />
						</AnimatedView>
					)}
				</View>
			)}

			<View style={buttonContainerStyles}>
				<Button
					size="large"
					text={t('receive_specify')}
					onPress={(): void => navigation.navigate('ReceiveDetails')}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loading: {
		justifyContent: 'center',
	},
	carouselWrapper: {
		flex: 1,
		alignItems: 'center',
	},
	carousel: {
		alignItems: 'center',
	},
	slide: {
		paddingHorizontal: 16,
		alignItems: 'center',
	},
	qrCode: {
		borderRadius: 10,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 32,
		overflow: 'hidden',
	},
	qrIconContainer: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
	},
	qrIcon: {
		backgroundColor: 'white',
		borderRadius: 50,
		padding: 9,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionButton: {
		paddingHorizontal: 16,
		minWidth: 0,
	},
	buttonSpacer: {
		width: 16,
	},
	invoices: {
		backgroundColor: '#171717',
		borderRadius: 9,
		padding: 32,
		width: '100%',
	},
	invoice: {},
	invoiceLabel: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	invoiceLabelIcon: {
		marginLeft: 2,
	},
	invoiceText: {
		position: 'relative',
		marginVertical: 16,
		zIndex: 1,
	},
	divider: {
		height: 32,
	},
	dots: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignSelf: 'center',
		marginTop: 16,
		width: 27,
	},
	tooltip: {
		position: 'absolute',
		top: 18,
		width: '100%',
		alignSelf: 'center',
	},
	tooltipUnified: {
		position: 'absolute',
		top: '45%',
	},
	buttonContainer: {
		paddingHorizontal: 16,
		marginTop: 'auto',
	},
});

export default memo(Receive);
