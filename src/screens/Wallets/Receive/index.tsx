import React, {
	memo,
	ReactElement,
	useMemo,
	useState,
	useEffect,
	useRef,
	MutableRefObject,
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
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';

import {
	CopyIcon,
	ShareIcon,
	TouchableOpacity,
	AnimatedView,
} from '../../../styles/components';
import Store from '../../../store/types';
import { resetInvoice } from '../../../store/actions/receive';
import { updateMetaIncTxTags } from '../../../store/actions/metadata';
import { getReceiveAddress } from '../../../utils/wallet';
import { getUnifiedUri } from '../../../utils/receive';
import { createLightningInvoice, refreshLdk } from '../../../utils/lightning';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Button from '../../../components/Button';
import Tooltip from '../../../components/Tooltip';
import { generateNewReceiveAddress } from '../../../store/actions/wallet';
import { showErrorNotification } from '../../../utils/notifications';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import BitcoinLogo from '../../../assets/bitcoin-logo-small.svg';

const QrIcon = (): ReactElement => {
	return (
		<View style={styles.qrIconContainer}>
			<View style={styles.qrIcon}>
				<BitcoinLogo />
			</View>
		</View>
	);
};

const Receive = ({ navigation }): ReactElement => {
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const { amount, message, tags } = useSelector(
		(store: Store) => store.receive,
	);
	const receiveNavigationIsOpen = useSelector(
		(store: Store) => store.user.viewController.receiveNavigation.isOpen,
	);
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const [loading, setLoading] = useState(true);
	const [showCopy, setShowCopy] = useState(false);
	const [receiveAddress, setReceiveAddress] = useState('');
	const [lightningInvoice, setLightningInvoice] = useState('');
	const qrRef = useRef<object>(null);

	useBottomSheetBackPress('receiveNavigation');

	const getLightningInvoice = useCallback(async (): Promise<void> => {
		if (!receiveNavigationIsOpen) {
			return;
		}
		const response = await createLightningInvoice({
			amountSats: amount,
			description: message,
			expiryDeltaSeconds: 180,
		});

		if (response.isErr()) {
			showErrorNotification({
				title: 'Unable to generate lightning invoice.',
				message: response.error.message,
			});
			return;
		}

		if (response.isOk()) {
			setLightningInvoice(response.value.to_str);
		}
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
			});
			if (response.isOk()) {
				console.info(`generated fresh address ${response.value.address}`);
				setReceiveAddress(response.value.address);
			}
		} else {
			const response = getReceiveAddress({
				selectedNetwork,
				selectedWallet,
			});
			if (response.isOk()) {
				console.info(`reusing address ${response.value}`);
				setReceiveAddress(response.value);
			}
		}
	}, [amount, receiveNavigationIsOpen, selectedNetwork, selectedWallet]);

	const setInvoiceDetails = useCallback(async (): Promise<void> => {
		if (!loading) {
			setLoading(true);
		}
		await Promise.all([getLightningInvoice(), getAddress()]);
		setLoading(false);
	}, [getAddress, getLightningInvoice, loading]);

	useEffect(() => {
		resetInvoice();
		if (receiveNavigationIsOpen) {
			refreshLdk({ selectedWallet, selectedNetwork }).then();
		}
	}, [selectedNetwork, selectedWallet, receiveNavigationIsOpen]);

	useEffect(() => {
		setInvoiceDetails().then();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amount, message, selectedNetwork, selectedWallet]);

	useEffect(() => {
		if (tags.length !== 0 && receiveAddress) {
			updateMetaIncTxTags(receiveAddress, lightningInvoice, tags);
		}
	}, [receiveAddress, lightningInvoice, tags]);

	const uri = useMemo((): string => {
		return getUnifiedUri({
			bitcoin: receiveAddress,
			amount,
			label: message,
			message,
			lightning: lightningInvoice,
		});
	}, [amount, lightningInvoice, message, receiveAddress]);

	const handleCopy = (): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(uri);
	};

	const handleCopyQrCode = (): void => {
		console.log('TODO: copy QR code');
	};

	const handleShare = (): void => {
		const url = `data:image/png;base64,${qrRef.current}`;

		try {
			Share.open({
				title: 'Share receiving address',
				message: uri,
				url,
				type: 'image/png',
			});
		} catch (e) {
			console.log(e);
		}
	};

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

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title="Receive Bitcoin"
				displayBackButton={false}
			/>
			<View style={styles.qrCodeContainer}>
				{loading && (
					<View style={[styles.loading, { height: qrSize, width: qrSize }]}>
						<ActivityIndicator color="white" />
					</View>
				)}
				{!loading && (
					<TouchableOpacity
						color="white"
						activeOpacity={1}
						onPress={handleCopy}
						onLongPress={handleCopyQrCode}
						style={styles.qrCode}>
						<QRCode
							value={uri}
							size={qrSize}
							getRef={(c): void => {
								if (!c || !qrRef) {
									return;
								}
								c.toDataURL(
									(data) =>
										((qrRef as MutableRefObject<object>).current = data),
								);
							}}
						/>
						<QrIcon />
					</TouchableOpacity>
				)}

				{showCopy && (
					<AnimatedView
						entering={FadeIn.duration(500)}
						exiting={FadeOut.duration(500)}
						color="transparent"
						style={styles.tooltip}>
						<Tooltip text="Invoice Copied To Clipboard" />
					</AnimatedView>
				)}
			</View>
			<View style={styles.row}>
				<Button
					icon={<CopyIcon width={18} color="brand" />}
					text="Copy"
					onPress={handleCopy}
				/>
				<View style={styles.buttonSpacer} />
				<Button
					icon={<ShareIcon width={18} color="brand" />}
					text="Share"
					onPress={handleShare}
				/>
			</View>
			<View style={buttonContainerStyles}>
				<Button
					size="large"
					text="Specify Invoice"
					onPress={(): void => navigation.navigate('ReceiveDetails')}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
	qrCodeContainer: {
		alignItems: 'center',
		marginBottom: 32,
	},
	qrCode: {
		borderRadius: 10,
		padding: 16,
		position: 'relative',
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
	tooltip: {
		position: 'absolute',
		top: '68%',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonSpacer: {
		width: 16,
	},
	buttonContainer: {
		marginTop: 'auto',
	},
	loading: {
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(Receive);
