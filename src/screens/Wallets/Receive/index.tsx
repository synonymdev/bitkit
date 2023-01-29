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
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';

import { TouchableOpacity, AnimatedView } from '../../../styles/components';
import { CopyIcon, ShareIcon } from '../../../styles/icons';
import { resetInvoice } from '../../../store/actions/receive';
import { updateMetaIncTxTags } from '../../../store/actions/metadata';
import { getReceiveAddress } from '../../../utils/wallet';
import { getUnifiedUri } from '../../../utils/receive';
import { refreshLdk } from '../../../utils/lightning';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Button from '../../../components/Button';
import Tooltip from '../../../components/Tooltip';
import { generateNewReceiveAddress } from '../../../store/actions/wallet';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import BitcoinLogo from '../../../assets/bitcoin-logo-small.svg';
import { createLightningInvoice } from '../../../store/actions/lightning';
import { useLightningBalance } from '../../../hooks/lightning';
import { sleep } from '../../../utils/helpers';
import { viewControllerIsOpenSelector } from '../../../store/reselect/ui';
import {
	addressTypeSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { receiveSelector } from '../../../store/reselect/receive';
import { ReceiveScreenProps } from '../../../navigation/types';

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
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const { amount, message, tags } = useSelector(receiveSelector);
	const receiveNavigationIsOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'receiveNavigation'),
	);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const addressType = useSelector(addressTypeSelector);

	const [loading, setLoading] = useState(true);
	const [isSharing, setIsSharing] = useState(false);
	const [showCopy, setShowCopy] = useState(false);
	const [receiveAddress, setReceiveAddress] = useState('');
	const [lightningInvoice, setLightningInvoice] = useState('');
	const lightningBalance = useLightningBalance(false);
	const qrRef = useRef<string>();

	useBottomSheetBackPress('receiveNavigation');

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

		console.info(`lightning invoice: ${response.value.to_str}`);
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

	const handleCopy = (): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(uri);
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

	const handleShare = useCallback((): void => {
		setIsSharing(true);
		const image = `data:image/png;base64,${qrRef.current}`;
		try {
			Share.open({
				title: 'Share receiving address',
				message: uri,
				url: image,
				type: 'image/png',
			});
		} catch (e) {
			console.log(e);
		} finally {
			setIsSharing(true);
		}
	}, [uri]);

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
		<View style={styles.container} testID="ReceiveScreen">
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
						style={styles.qrCode}
						testID="QRCode"
						accessibilityLabel={uri}>
						<QRCode
							value={uri}
							size={qrSize}
							getRef={(c): void => {
								if (c) {
									c.toDataURL((data: string) => (qrRef.current = data));
								}
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
					disabled={isSharing}
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
