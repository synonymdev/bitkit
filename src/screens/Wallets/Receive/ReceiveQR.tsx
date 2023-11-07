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
	BitcoinCircleIcon,
	BitcoinSlantedIcon,
	CopyIcon,
	LightningCircleIcon,
	LightningIcon,
	PencileIcon,
	ShareIcon,
	UnifiedIcon,
} from '../../../styles/icons';
import { Caption13Up, Text01S, Text02S } from '../../../styles/text';
import { updatePendingInvoice } from '../../../store/actions/metadata';
import { createLightningInvoice } from '../../../store/actions/lightning';
import { generateNewReceiveAddress } from '../../../store/actions/wallet';
import { viewControllerIsOpenSelector } from '../../../store/reselect/ui';
import { useLightningBalance } from '../../../hooks/lightning';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { waitForLdk } from '../../../utils/lightning';
import { getUnifiedUri } from '../../../utils/receive';
import { ellipsis, sleep } from '../../../utils/helpers';
import { getReceiveAddress } from '../../../utils/wallet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import Tooltip from '../../../components/Tooltip';
import Dot from '../../../components/SliderDots';
import SwitchRow from '../../../components/SwitchRow';
import {
	addressTypeSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { receiveSelector } from '../../../store/reselect/receive';
import { ReceiveScreenProps } from '../../../navigation/types';
import { isGeoBlockedSelector } from '../../../store/reselect/user';
import { lightningSelector } from '../../../store/reselect/lightning';

type Slide = () => ReactElement;

const defaultTooltips = {
	unified: false,
	onchain: false,
	lightning: false,
};

const ReceiveQR = ({
	navigation,
}: ReceiveScreenProps<'ReceiveQR'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const dimensions = useWindowDimensions();
	const progressValue = useSharedValue(0);
	const carouselRef = useRef<ICarouselInstance>(null);
	const qrRef = useRef<any>('');

	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const addressType = useSelector(addressTypeSelector);
	const isGeoBlocked = useSelector(isGeoBlockedSelector);
	const lightning = useSelector(lightningSelector);
	const { id, amount, message, tags, jitOrder } = useSelector(receiveSelector);
	const lightningBalance = useLightningBalance(false);
	const receiveNavigationIsOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'receiveNavigation'),
	);

	const jitInvoice = jitOrder?.invoice.request;

	const [loading, setLoading] = useState(true);
	const [receiveAddress, setReceiveAddress] = useState('');
	const [lightningInvoice, setLightningInvoice] = useState('');
	const [showTooltip, setShowTooltip] = useState(defaultTooltips);
	const [isSharing, setIsSharing] = useState(false);
	const [enableInstant, setEnableInstant] = useState(
		!!jitInvoice || lightningBalance.remoteBalance > 0,
	);

	useBottomSheetBackPress('receiveNavigation');

	useEffect(() => {
		setEnableInstant(!!jitInvoice || lightningBalance.remoteBalance > 0);
	}, [jitInvoice, lightningBalance.remoteBalance]);

	const getLightningInvoice = useCallback(async (): Promise<void> => {
		if (
			!receiveNavigationIsOpen ||
			!lightningBalance.remoteBalance ||
			lightningBalance.remoteBalance < amount ||
			lightning.accountVersion < 2
		) {
			return;
		}

		await waitForLdk();

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
		await Promise.all([getLightningInvoice(), getAddress()]);
		await sleep(200);
		setLoading(false);
	}, [getAddress, getLightningInvoice, loading, receiveNavigationIsOpen]);

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
		if (id && tags.length !== 0 && receiveAddress && receiveNavigationIsOpen) {
			updatePendingInvoice({
				id,
				tags,
				address: receiveAddress,
				payReq: lightningInvoice,
			});
		}
	}, [id, receiveAddress, lightningInvoice, tags, receiveNavigationIsOpen]);

	const uri = useMemo((): string => {
		if (!receiveNavigationIsOpen) {
			return '';
		}

		if (enableInstant && jitInvoice) {
			return jitInvoice;
		}

		if (!enableInstant) {
			return getUnifiedUri({
				address: receiveAddress,
				amount,
				label: message,
				message,
			});
		}

		return getUnifiedUri({
			address: receiveAddress,
			amount,
			label: message,
			message,
			lightning: lightningInvoice,
		});
	}, [
		jitInvoice,
		enableInstant,
		amount,
		lightningInvoice,
		message,
		receiveAddress,
		receiveNavigationIsOpen,
	]);

	const onToggleInstant = (): void => {
		if (!isGeoBlocked && !jitInvoice && lightningBalance.remoteBalance === 0) {
			navigation.navigate('ReceiveAmount');
		} else {
			setEnableInstant(!enableInstant);
		}
	};

	const onEdit = useCallback((): void => {
		if (jitInvoice) {
			navigation.navigate('ReceiveAmount');
		} else {
			navigation.navigate('ReceiveDetails', {
				receiveAddress,
				lightningInvoice,
				enableInstant,
			});
		}
	}, [jitInvoice, navigation, receiveAddress, lightningInvoice, enableInstant]);

	const onCopy = (text: string, tooltipId: string): void => {
		Clipboard.setString(text);
		setShowTooltip((prevState) => ({ ...prevState, [tooltipId]: true }));
		setTimeout(() => setShowTooltip(defaultTooltips), 1500);
	};

	const onCopyQrCode = useCallback((): void => {
		console.log('TODO: copy QR code as image');
		// not implemented in upstream yet
		// https://github.com/react-native-clipboard/clipboard/issues/6
		// Clipboard.setString(qrRef.current);
	}, []);

	const onShare = useCallback(
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

	const qrMaxHeight = dimensions.height / 2.2;
	const qrMaxWidth = dimensions.width - 16 * 2;
	const qrSize = Math.min(qrMaxWidth, qrMaxHeight);

	const displayReceiveInstantlySwitch = useMemo((): boolean => {
		if (lightning.accountVersion < 2) {
			return false;
		}
		return !(isGeoBlocked && !lightningBalance.remoteBalance);
	}, [isGeoBlocked, lightning.accountVersion, lightningBalance.remoteBalance]);

	const QrIcon = useCallback((): ReactElement => {
		return (
			<View style={styles.qrIconContainer}>
				<View style={styles.qrIcon}>
					{enableInstant && jitInvoice ? (
						<LightningCircleIcon width={50} height={50} />
					) : (
						<>
							{enableInstant ? (
								<UnifiedIcon width={50} height={50} />
							) : (
								<BitcoinCircleIcon color="bitcoin" width={50} height={50} />
							)}
						</>
					)}
				</View>
			</View>
		);
	}, [jitInvoice, enableInstant]);

	const Slide1 = useCallback((): ReactElement => {
		return (
			<View style={styles.slide}>
				<TouchableOpacity
					style={styles.qrCode}
					color="white"
					activeOpacity={1}
					accessibilityLabel={uri}
					testID="QRCode"
					onPress={(): void => onCopy(uri, 'unified')}
					onLongPress={onCopyQrCode}>
					<QRCode
						value={uri}
						size={qrSize}
						quietZone={16}
						getRef={(c): void => (qrRef.current = c)}
					/>
					<QrIcon />

					{showTooltip.unified && (
						<AnimatedView
							style={styles.tooltipUnified}
							color="transparent"
							entering={FadeIn}>
							<Tooltip text={t('receive_copied')} />
						</AnimatedView>
					)}
				</TouchableOpacity>
				<View style={styles.actions}>
					<Button
						style={styles.actionButton}
						icon={<PencileIcon width={18} color="brand" />}
						text={t('edit')}
						testID="SpecifyInvoiceButton"
						onPress={onEdit}
					/>
					<View style={styles.buttonSpacer} />
					<Button
						style={styles.actionButton}
						icon={<CopyIcon width={18} color="brand" />}
						text={t('copy')}
						testID="ReceiveCopyQR"
						onPress={(): void => onCopy(uri, 'unified')}
					/>
					<View style={styles.buttonSpacer} />
					<Button
						style={styles.actionButton}
						text={t('share')}
						icon={<ShareIcon width={18} color="brand" />}
						disabled={isSharing}
						onPress={(): void => {
							qrRef.current?.toDataURL((data: string) => {
								const imageData = data.replace(/(\r\n|\n|\r)/gm, '');
								onShare(uri, imageData);
							});
						}}
					/>
				</View>
			</View>
		);
	}, [
		QrIcon,
		onEdit,
		onCopyQrCode,
		onShare,
		isSharing,
		uri,
		qrSize,
		showTooltip.unified,
		t,
	]);

	const lInvoice = useMemo((): string => {
		if (jitInvoice && jitInvoice !== '') {
			return jitInvoice;
		}
		if (lightningInvoice && lightningInvoice !== '') {
			return lightningInvoice;
		}
		return '';
	}, [jitInvoice, lightningInvoice]);

	const Slide2 = useCallback((): ReactElement => {
		return (
			<View style={styles.slide}>
				<ThemedView style={styles.invoices} color="white04">
					{!jitInvoice && (
						<View style={styles.invoice} testID="ReceiveOnchainInvoice">
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
								<Text02S>{ellipsis(receiveAddress, 25)}</Text02S>
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
										onCopy(receiveAddress, 'onchain');
									}}
								/>
								<View style={styles.buttonSpacer} />
								<Button
									style={styles.actionButton}
									text={t('share')}
									icon={<ShareIcon width={18} color="brand" />}
									disabled={isSharing}
									onPress={(): void => {
										onShare(receiveAddress);
									}}
								/>
							</View>
						</View>
					)}

					{enableInstant && lInvoice !== '' && (
						<>
							{!jitInvoice && <View style={styles.divider} />}
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
									<Text02S
										testID="ReceiveLightningInvoice"
										accessibilityLabel={lInvoice}>
										{ellipsis(lInvoice, 33)}
									</Text02S>
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
										icon={<CopyIcon width={18} color="purple" />}
										text={t('copy')}
										onPress={(): void => {
											onCopy(lInvoice, 'lightning');
										}}
									/>
									<View style={styles.buttonSpacer} />
									<Button
										style={styles.actionButton}
										text={t('share')}
										icon={<ShareIcon width={18} color="purple" />}
										disabled={isSharing}
										onPress={(): void => {
											onShare(lInvoice);
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
		enableInstant,
		jitInvoice,
		t,
		receiveAddress,
		showTooltip.onchain,
		showTooltip.lightning,
		isSharing,
		lInvoice,
		onShare,
	]);

	const slides = useMemo((): Slide[] => [Slide1, Slide2], [Slide1, Slide2]);

	return (
		<View style={styles.container}>
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
						height={qrMaxHeight + 80}
						loop={false}
						panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
						testID="ReceiveSlider"
						renderItem={({ index }): ReactElement => {
							const Slide = slides[index];
							return <Slide key={index} />;
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
				</View>
			)}

			{displayReceiveInstantlySwitch && (
				<View style={styles.buttonContainer}>
					<SwitchRow
						color="purple"
						isEnabled={enableInstant}
						showDivider={false}
						onPress={onToggleInstant}>
						<Text01S>{t('receive_instantly')}</Text01S>
					</SwitchRow>
				</View>
			)}
			<SafeAreaInset type="bottom" minPadding={16} />
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
		bottom: 20,
	},
	buttonContainer: {
		paddingHorizontal: 16,
		marginTop: 'auto',
	},
});

export default memo(ReceiveQR);
