import React, { memo, ReactElement, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import Lottie from 'lottie-react-native';

import {
	Subtitle,
	Caption13Up,
	Text02M,
	ClockIcon,
} from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Glow from '../../components/Glow';
import AmountToggle from '../../components/AmountToggle';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Store from '../../store/types';
import { toggleView } from '../../store/actions/user';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';

const NewTxPrompt = (): ReactElement => {
	const snapPoints = useMemo(() => [600], []);

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

	const source = require('../../assets/illustrations/coin-stack-x.png');

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleClose}
			view="newTxPrompt">
			<View style={styles.root}>
				<Lottie
					source={require('../../assets/lottie/confetti-orange.json')}
					autoPlay
					loop
				/>
				<View>
					<Subtitle style={styles.title}>Payment Received!</Subtitle>
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
						<Image source={source} style={styles.image3} />
						<Image source={source} style={styles.image2} />
						<Image source={source} style={styles.image1} />
						<Image source={source} style={styles.image4} />
					</View>
					{isOpen && transaction?.height === 0 && (
						<View style={styles.confirming}>
							<ClockIcon color="gray1" />
							<Text02M color="gray1" style={styles.confirmingText}>
								Confirming
							</Text02M>
						</View>
					)}
					<SafeAreaInsets type="bottom" />
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 16,
		justifyContent: 'space-between',
	},
	title: {
		marginBottom: 60,
		alignSelf: 'center',
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
		alignSelf: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		marginBottom: 8,
	},
	confirmingText: {
		marginLeft: 8,
	},
});

export default memo(NewTxPrompt);
