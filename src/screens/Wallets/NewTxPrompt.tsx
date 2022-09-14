import React, { memo, ReactElement, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Lottie from 'lottie-react-native';

import { Caption13Up, Text02M, ClockIcon } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Glow from '../../components/Glow';
import AmountToggle from '../../components/AmountToggle';
import Store from '../../store/types';
import { toggleView } from '../../store/actions/user';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';

const confettiSrc = require('../../assets/lottie/confetti-orange.json');
const imageSrc = require('../../assets/illustrations/coin-stack-x.png');

const NewTxPrompt = (): ReactElement => {
	const snapPoints = useMemo(() => [600], []);
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.confirming,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const txid = useSelector(
		(store: Store) => store.user.viewController?.newTxPrompt?.txid,
	);
	const isOpen = useSelector(
		(store: Store) => store.user.viewController?.newTxPrompt?.isOpen,
	);

	const transaction = useSelector((store: Store) => {
		if (!txid) {
			return undefined;
		}
		const wallet = store.wallet.selectedWallet;
		const network = store.wallet.selectedNetwork;
		return store.wallet?.wallets[wallet]?.transactions[network]?.[txid];
	});

	useBottomSheetBackPress('newTxPrompt');

	const handleClose = (): void => {
		toggleView({
			view: 'newTxPrompt',
			data: { isOpen: false },
		});
	};

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleClose}
			view="newTxPrompt">
			<View style={styles.container}>
				<Lottie source={confettiSrc} autoPlay loop />
				<View>
					<BottomSheetNavigationHeader
						title="Payment Received!"
						displayBackButton={false}
					/>
					<Caption13Up style={styles.received} color="gray1">
						You just received
					</Caption13Up>
					{isOpen && transaction && (
						<AmountToggle sats={transaction.value * 10e7} />
					)}
				</View>

				<View>
					<View style={styles.imageContainer}>
						<Glow style={styles.glow} size={600} color="white32" />
						<Image source={imageSrc} style={styles.image3} />
						<Image source={imageSrc} style={styles.image2} />
						<Image source={imageSrc} style={styles.image1} />
						<Image source={imageSrc} style={styles.image4} />
					</View>

					{isOpen && transaction?.height === 0 && (
						<View style={buttonContainerStyles}>
							<ClockIcon color="gray1" />
							<Text02M color="gray1" style={styles.confirmingText}>
								Confirming
							</Text02M>
						</View>
					)}
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		justifyContent: 'space-between',
	},
	received: {
		marginBottom: 8,
	},
	imageContainer: {
		alignSelf: 'center',
		position: 'relative',
		height: 200,
		width: 200,
		justifyContent: 'center',
		alignItems: 'center',
	},
	image1: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: 0,
		transform: [{ scaleX: -1 }],
	},
	image2: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '7%',
		transform: [{ scaleX: -1 }, { rotate: '165deg' }],
	},
	image3: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '14%',
		transform: [{ scaleX: -1 }, { rotate: '150deg' }],
	},
	image4: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '75%',
		left: '65%',
		transform: [{ rotate: '45deg' }],
	},
	glow: {
		position: 'absolute',
	},
	confirming: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	confirmingText: {
		marginLeft: 8,
	},
});

export default memo(NewTxPrompt);
