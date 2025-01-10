import React, {
	memo,
	ReactElement,
	useMemo,
	useState,
	useEffect,
	useRef,
	useCallback,
} from 'react';
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
import { Trans, useTranslation } from 'react-i18next';

import {
	View as ThemedView,
	TouchableOpacity,
	AnimatedView,
} from '../../../styles/components';
import {
	ArrowLNFunds,
	BitcoinCircleIcon,
	BitcoinSlantedIcon,
	CopyIcon,
	LightningCircleIcon,
	LightningIcon,
	PencilIcon,
	ShareIcon,
	UnifiedIcon,
} from '../../../styles/icons';
import { Caption13Up, BodyM, BodyS, Headline } from '../../../styles/text';
import { createLightningInvoice } from '../../../store/utils/lightning';
import { updatePendingInvoice } from '../../../store/slices/metadata';
import { generateNewReceiveAddress } from '../../../store/actions/wallet';
import {
	appStateSelector,
	isLDKReadySelector,
	viewControllerIsOpenSelector,
} from '../../../store/reselect/ui';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useLightningBalance } from '../../../hooks/lightning';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { waitForLdk } from '../../../utils/lightning';
import { getUnifiedUri } from '../../../utils/receive';
import { ellipsis, sleep } from '../../../utils/helpers';
import { getReceiveAddress } from '../../../utils/wallet';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
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
import { getWalletStore } from '../../../store/helpers';
import { showToast } from '../../../utils/notifications';

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

	const dispatch = useAppDispatch();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const selectedAddressType = useAppSelector(addressTypeSelector);
	const addressType = useAppSelector(addressTypeSelector);
	const isGeoBlocked = useAppSelector(isGeoBlockedSelector);
	const isLDKReady = useAppSelector(isLDKReadySelector);
	const appState = useAppSelector(appStateSelector);
	const { id, amount, message, tags, jitOrder } =
		useAppSelector(receiveSelector);
	const lightningBalance = useLightningBalance(false);
	const receiveNavigationIsOpen = useAppSelector((state) =>
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const getLightningInvoice = useCallback(async (): Promise<void> => {
		if (!receiveNavigationIsOpen || !lightningBalance.remoteBalance) {
			return;
		}

		if (lightningBalance.remoteBalance < amount && !jitInvoice) {
			setLightningInvoice('');
			showToast({
				type: 'error',
				title: t('receive_insufficient_title'),
				description: t('receive_insufficient_text'),
			});
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
	}, [jitInvoice, amount, message]);

	const getAddress = useCallback(async (): Promise<void> => {
		if (!receiveNavigationIsOpen) {
			return;
		}
		if (amount > 0) {
			console.info('getting fresh address');
			const response = await generateNewReceiveAddress({
				addressType,
			});
			if (response.isOk()) {
				console.info(`generated fresh address ${response.value.address}`);
				setReceiveAddress(response.value.address);
			}
		} else {
			const response = await getReceiveAddress({
				addressType,
			});
			if (response.isOk()) {
				console.info(`reusing address ${response.value}`);
				setReceiveAddress(response.value);
			} else {
				try {
					const address =
						getWalletStore().wallets[selectedWallet]?.addressIndex[
							selectedNetwork
						][selectedAddressType]?.address;
					if (address) {
						console.info(`reusing address ${address}`);
						setReceiveAddress(address);
					}
				} catch {}
			}
		}
	}, [
		receiveNavigationIsOpen,
		amount,
		selectedNetwork,
		selectedWallet,
		addressType,
		selectedAddressType,
	]);

	const setInvoiceDetails = useCallback(async (): Promise<void> => {
		if (!receiveNavigationIsOpen) {
			return;
		}
		if (!loading) {
			setLoading(true);
		}
		// Gives the modal animation time to start.
		getLightningInvoice().then();
		await Promise.all([getAddress()]);
		await sleep(200);
		setLoading(false);
	}, [getAddress, getLightningInvoice, loading, receiveNavigationIsOpen]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!receiveNavigationIsOpen) {
			return;
		}
		// Gives the modal animation time to start.
		sleep(50).then(() => {
			setInvoiceDetails().then();
		});
	}, [
		amount,
		message,
		selectedNetwork,
		selectedWallet,
		receiveNavigationIsOpen,
	]);

	useEffect(() => {
		if (id && tags.length !== 0 && receiveAddress && receiveNavigationIsOpen) {
			dispatch(
				updatePendingInvoice({
					id,
					tags,
					address: receiveAddress,
					payReq: lightningInvoice,
				}),
			);
		}
	}, [
		id,
		receiveAddress,
		lightningInvoice,
		tags,
		receiveNavigationIsOpen,
		dispatch,
	]);

	useEffect(() => {
		if (receiveNavigationIsOpen && enableInstant && appState !== 'active') {
			showToast({
				type: 'error',
				title: t('receive_foreground_title'),
				description: t('receive_foreground_msg'),
			});
		}
	}, [t, appState, enableInstant, receiveNavigationIsOpen]);

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

	const onToggleInstant = useCallback((): void => {
		if (isGeoBlocked && lightningBalance.remoteBalance === 0) {
			navigation.navigate('ReceiveGeoBlocked');
		} else if (
			!isGeoBlocked &&
			!jitInvoice &&
			lightningBalance.remoteBalance === 0
		) {
			navigation.navigate('ReceiveAmount');
		} else {
			setEnableInstant(!enableInstant);
		}
	}, [
		enableInstant,
		isGeoBlocked,
		jitInvoice,
		lightningBalance.remoteBalance,
		navigation,
	]);

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

	const QrIcon = useCallback((): ReactElement => {
		return (
			<View style={styles.qrIconContainer}>
				<View style={styles.qrIcon}>
					{enableInstant && jitInvoice ? (
						<LightningCircleIcon width={50} height={50} />
					) : (
						<>
							{enableInstant && lightningInvoice ? (
								<UnifiedIcon width={50} height={50} />
							) : (
								<BitcoinCircleIcon width={50} height={50} />
							)}
						</>
					)}
				</View>
			</View>
		);
	}, [jitInvoice, enableInstant, lightningInvoice]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
						getRef={(c): void => {
							qrRef.current = c;
						}}
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
						color="white10"
						icon={<PencilIcon width={18} color="brand" />}
						text={t('edit')}
						testID="SpecifyInvoiceButton"
						onPress={onEdit}
					/>
					<Button
						style={styles.actionButton}
						color="white10"
						icon={<CopyIcon width={18} color="brand" />}
						text={t('copy')}
						testID="ReceiveCopyQR"
						onPress={(): void => onCopy(uri, 'unified')}
					/>
					<Button
						style={styles.actionButton}
						color="white10"
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const Slide2 = useCallback((): ReactElement => {
		return (
			<View style={styles.slide}>
				<ThemedView style={styles.invoices} color="white06">
					{(!jitInvoice || !enableInstant) && (
						<View>
							<View style={styles.invoiceLabel}>
								<Caption13Up color="secondary">
									{t('receive_bitcoin_invoice')}
								</Caption13Up>
								<BitcoinSlantedIcon
									style={styles.invoiceLabelIcon}
									color="secondary"
									height={14}
									width={20}
								/>
							</View>
							<View style={styles.invoiceText}>
								<BodyS
									accessibilityLabel={receiveAddress}
									testID="ReceiveOnchainInvoice">
									{ellipsis(receiveAddress, 25)}
								</BodyS>
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
									color="white10"
									icon={<CopyIcon width={18} color="brand" />}
									text={t('copy')}
									onPress={(): void => {
										onCopy(receiveAddress, 'onchain');
									}}
								/>
								<Button
									style={styles.actionButton}
									color="white10"
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
							<View>
								<View style={styles.invoiceLabel}>
									<Caption13Up color="secondary">
										{t('receive_lightning_invoice')}
									</Caption13Up>
									<LightningIcon
										style={styles.invoiceLabelIcon}
										color="secondary"
										height={14}
										width={15}
									/>
								</View>
								<View style={styles.invoiceText}>
									<BodyS
										accessibilityLabel={lInvoice}
										numberOfLines={1}
										testID="ReceiveLightningInvoice">
										{lInvoice.toUpperCase()}
									</BodyS>
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
										color="white10"
										icon={<CopyIcon width={18} color="purple" />}
										text={t('copy')}
										onPress={(): void => {
											onCopy(lInvoice, 'lightning');
										}}
									/>
									<Button
										style={styles.actionButton}
										color="white10"
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

	const ReceiveInstantlySwitch = useCallback((): ReactElement => {
		if (!isLDKReady) {
			return (
				<View style={styles.buttonContainer}>
					<View style={styles.ldkStarting}>
						<View style={styles.ldkStartingLeft}>
							<BodyM>{t('receive_ldk_init')}</BodyM>
						</View>
						<View style={styles.ldkStartingRight}>
							<ActivityIndicator color="white" />
						</View>
					</View>
				</View>
			);
		}

		return (
			<View style={styles.buttonContainer}>
				{!enableInstant && (
					<Headline>
						<Trans
							t={t}
							i18nKey="receive_text_lnfunds"
							components={{ accent: <Headline color="purple" /> }}
						/>
					</Headline>
				)}
				<SwitchRow
					style={styles.switchRow}
					color="purple"
					isEnabled={enableInstant}
					onPress={onToggleInstant}
					testID="ReceiveInstantlySwitch">
					{!enableInstant && <ArrowLNFunds color="secondary" />}
					<BodyM>{t('receive_spending')}</BodyM>
				</SwitchRow>
			</View>
		);
	}, [t, isLDKReady, enableInstant, onToggleInstant]);

	return (
		<>
			<GradientView style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('receive_bitcoin')}
					showBackButton={false}
				/>

				{loading || !uri ? (
					<View style={[styles.loading, { height: qrSize }]}>
						<ActivityIndicator color="white" />
					</View>
				) : (
					<View style={styles.carouselWrapper}>
						<Carousel
							ref={carouselRef}
							style={styles.carousel}
							data={slides}
							width={dimensions.width}
							height={qrMaxHeight + 64}
							loop={false}
							scrollAnimationDuration={100}
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

				<ReceiveInstantlySwitch />

				<SafeAreaInset type="bottom" minPadding={16} />
			</GradientView>
		</>
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
		marginBottom: 16,
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
		gap: 16,
	},
	actionButton: {
		paddingHorizontal: 16,
	},
	invoices: {
		borderRadius: 9,
		padding: 32,
		width: '100%',
	},
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
	switchRow: {
		paddingVertical: 0,
	},
	ldkStarting: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingVertical: 8,
	},
	ldkStartingLeft: {
		flex: 1,
		justifyContent: 'center',
	},
	ldkStartingRight: {
		justifyContent: 'center',
		alignItems: 'flex-end',
		alignSelf: 'center',
	},
});

export default memo(ReceiveQR);
