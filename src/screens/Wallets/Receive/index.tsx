import React, {
	memo,
	ReactElement,
	useMemo,
	useState,
	useRef,
	forwardRef,
} from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet, View } from 'react-native';
import Swiper from 'react-native-swiper';
import QRCode from 'react-native-qrcode-svg';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Flatlist } from 'react-native-gesture-handler';

import {
	View as ThemedView,
	Caption13S,
	CopyIcon,
	ShareIcon,
	TouchableOpacity,
	AnimatedView,
} from '../../../styles/components';
import { getReceiveAddress } from '../../../utils/wallet';
import Store from '../../../store/types';
import { EAddressTypeNames } from '../../../store/types/wallet';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import Tooltip from '../../../components/Tooltip';

const Dot = ({ active }: { active?: boolean }): ReactElement => {
	return (
		<ThemedView color={active ? 'white' : 'gray2'} style={styles.pageDot} />
	);
};

const Slide = forwardRef(
	(
		{
			address,
			addressType,
			onPress,
		}: {
			address: string;
			addressType: string;
			onPress: Function;
		},
		ref,
	): ReactElement => {
		return (
			<View style={styles.slide}>
				<TouchableOpacity
					color="white"
					activeOpacity={1}
					onPress={onPress}
					style={styles.qrCode}>
					<QRCode
						logo={require('../../../assets/qrcode-bitcoin.png')}
						logoSize={40}
						value={address}
						size={200}
						getRef={(c): void => {
							if (!c || !ref) {
								return;
							}
							c.toDataURL((data) => (ref.current[addressType] = data));
						}}
					/>
				</TouchableOpacity>
				<View style={styles.address}>
					<Caption13S style={styles.text}>{address}</Caption13S>
				</View>
				<Caption13S color="white5" style={styles.addressType}>
					({EAddressTypeNames[addressType]})
				</Caption13S>
			</View>
		);
	},
);

const Receive = (): ReactElement => {
	const [index, setIndex] = useState(0);
	const [showCopy, setShowCopy] = useState(false);
	const swiperRef = useRef(null);
	const qrRef = useRef<object>({ p2wpkh: null, p2sh: null, p2pkh: null });
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const initial = useSelector(
		(store: Store) => store.user.viewController?.receiveNavigation?.initial,
	);
	const displayBackButton = initial === 'ReceiveAssetPickerList';

	const addresses = useMemo(() => {
		return ['p2wpkh', 'p2pkh', 'p2sh'].map((addressType) => {
			const response = getReceiveAddress({
				addressType,
				selectedWallet,
				selectedNetwork,
			});
			const address = response.isOk() ? response.value : ' ';
			return { addressType, address };
		});
	}, [selectedNetwork, selectedWallet]);

	const handleCopy = (address: string): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(address);
	};

	const handleCopyButton = (): void => {
		const { address } = addresses[index];
		handleCopy(address);
	};

	const handleShare = (): void => {
		const { addressType, address } = addresses[index];
		const url = `data:image/png;base64,${qrRef.current[addressType]}`;

		try {
			Share.open({
				title: 'Share receiving address',
				message: address,
				url,
				type: 'image/png',
			});
		} catch (e) {
			console.log(e);
		}
	};

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<NavigationHeader
				displayBackButton={displayBackButton}
				title="Receive Bitcoin"
				size="sm"
			/>
			<View style={styles.swiper}>
				<Swiper
					ref={swiperRef}
					dot={<Dot />}
					activeDot={<Dot active />}
					onIndexChanged={setIndex}
					loop={false}>
					{addresses.map(({ address, addressType }) => (
						<Slide
							key={addressType}
							address={address}
							addressType={addressType}
							ref={qrRef}
							onPress={(): void => handleCopy(address)}
						/>
					))}
				</Swiper>
			</View>
			<View style={styles.row}>
				<Button
					icon={<CopyIcon height={18} color="brand" />}
					text="Copy"
					onPress={handleCopyButton}
				/>
				<View style={styles.buttonSpacer} />
				<Button
					icon={<ShareIcon height={18} color="brand" />}
					text="Share"
					onPress={handleShare}
				/>
			</View>
			{showCopy && (
				<AnimatedView
					entering={FadeIn.duration(500)}
					exiting={FadeOut.duration(500)}
					color="transparent"
					style={styles.tooltip}>
					<Tooltip text="Address copied to clipboard" />
				</AnimatedView>
			)}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	swiper: {
		marginTop: 20,
		height: 340,
	},
	slide: {
		alignItems: 'center',
	},
	pageDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		marginLeft: 4,
		marginRight: 4,
	},
	qrCode: {
		padding: 10,
	},
	address: {
		width: 200,
		marginTop: 8,
	},
	text: {
		textAlign: 'center',
	},
	addressType: {
		marginTop: 8,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	buttonSpacer: {
		width: 16,
	},
	tooltip: {
		alignSelf: 'center',
		marginTop: 10,
	},
});

export default memo(Receive);
