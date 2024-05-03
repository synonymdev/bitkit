import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Lottie from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { ldk } from '@synonymdev/react-native-ldk';

import Button from '../components/Button';
import AmountToggle from '../components/AmountToggle';
import SafeAreaInset from '../components/SafeAreaInset';
import BottomSheetWrapper from '../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../components/BottomSheetNavigationHeader';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useLightningMaxInboundCapacity } from '../hooks/lightning';
import { useBottomSheetBackPress, useSnapPoints } from '../hooks/bottomSheet';
import { showToast } from '../utils/notifications';
import { getNodeIdFromStorage, waitForLdk } from '../utils/lightning';
import { closeSheet } from '../store/slices/ui';
import { viewControllerSelector } from '../store/reselect/ui';
import { createLightningInvoice } from '../store/utils/lightning';
import { __TREASURE_HUNT_HOST__ } from '../constants/env';
import { rootNavigation } from '../navigation/root/RootNavigator';

const confettiPurpleSrc = require('../assets/lottie/confetti-purple.json');
const imageSrc = require('../assets/illustrations/coin-stack-x.png');

const OrangeTicket = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();
	const maxInboundCapacitySat = useLightningMaxInboundCapacity();
	const [isLoading, setIsLoading] = useState(true);
	const [paymentHash, setPaymentHash] = useState<string>();
	const [amount, setAmount] = useState<number>();
	const { isOpen, ticketId } = useAppSelector((state) => {
		return viewControllerSelector(state, 'orangeTicket');
	});

	useBottomSheetBackPress('orangeTicket');

	const getPrize = useCallback(async (): Promise<void> => {
		const getLightningInvoice = async (): Promise<string> => {
			const response = await createLightningInvoice({
				amountSats: 0,
				description: 'Orange Ticket',
				expiryDeltaSeconds: 3600,
			});

			if (response.isErr()) {
				showToast({
					type: 'error',
					title: 'Failed to create invoice',
					description: 'Bitkit could not prepare your claim.',
				});
				return '';
			}

			return response.value.to_str;
		};

		const getChest = async (): Promise<any> => {
			const response = await fetch(__TREASURE_HUNT_HOST__, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					method: 'getChest',
					params: { input: { chestId: ticketId } },
				}),
			});

			const { result } = await response.json();
			return result;
		};

		const openChest = async (): Promise<any> => {
			await waitForLdk();

			const nodePublicKey = getNodeIdFromStorage();
			const input = { chestId: ticketId, nodePublicKey };
			const signResult = await ldk.nodeSign({
				message: JSON.stringify(input),
				messagePrefix: '',
			});
			if (signResult.isErr()) {
				showToast({
					type: 'error',
					title: 'Failed to get prize',
					description: 'Bitkit could not sign your claim request.',
				});
				return;
			}
			const signature = signResult.value;

			const response = await fetch(__TREASURE_HUNT_HOST__, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					method: 'openChest',
					params: { input, signature },
				}),
			});

			const { result } = await response.json();
			return result;
		};

		const claimPrize = async (): Promise<any> => {
			const invoice = await getLightningInvoice();
			const nodePublicKey = getNodeIdFromStorage();

			if (invoice) {
				const input = {
					chestId: ticketId,
					invoice,
					maxInboundCapacitySat,
					nodePublicKey,
				};
				const signResult = await ldk.nodeSign({
					message: JSON.stringify(input),
					messagePrefix: '',
				});
				if (signResult.isErr()) {
					showToast({
						type: 'error',
						title: 'Failed to get prize',
						description: 'Bitkit could not sign your claim request.',
					});
					return;
				}
				const signature = signResult.value;

				const response = await fetch(__TREASURE_HUNT_HOST__, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						method: 'grabTreasure',
						params: { input, signature },
					}),
				});

				const { result } = await response.json();
				return result;
			}
		};

		if (!ticketId) {
			return;
		}

		const chestResponse = await getChest();
		if (chestResponse.error) {
			return;
		}
		setAmount(chestResponse.amountSat);

		const openResponse = await openChest();
		if (openResponse.error) {
			return;
		}
		setAmount(openResponse.amountSat);

		const claimResponse = await claimPrize();
		if (claimResponse.error) {
			return;
		}
		setIsLoading(false);
		setPaymentHash(claimResponse.btResponse.payment.paymentHash);
	}, [ticketId, maxInboundCapacitySat]);

	useEffect(() => {
		if (!isOpen) {
			setIsLoading(true);
			return;
		}

		getPrize();
	}, [isOpen, getPrize]);

	if (!isOpen || isLoading) {
		return <></>;
	}

	const onAmountPress = (): void => {
		if (paymentHash) {
			dispatch(closeSheet('orangeTicket'));
			rootNavigation.navigate('ActivityDetail', { id: paymentHash });
		}
	};

	const onButtonPress = (): void => {
		dispatch(closeSheet('orangeTicket'));
	};

	return (
		<BottomSheetWrapper
			view="orangeTicket"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.root}>
				<View style={styles.confetti} pointerEvents="none">
					<Lottie
						style={styles.lottie}
						source={confettiPurpleSrc}
						resizeMode="cover"
						autoPlay
						loop
					/>
				</View>
				<BottomSheetNavigationHeader
					title="Won Bitcoin!"
					displayBackButton={false}
				/>

				<View style={styles.content}>
					{amount && <AmountToggle amount={amount} onPress={onAmountPress} />}

					<View style={styles.imageContainer} pointerEvents="none">
						<Image style={styles.image1} source={imageSrc} />
						<Image style={styles.image2} source={imageSrc} />
						<Image style={styles.image3} source={imageSrc} />
					</View>

					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							text={t('awesome')}
							size="large"
							testID="OrangeTicketButton"
							onPress={onButtonPress}
						/>
					</View>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	confetti: {
		...StyleSheet.absoluteFillObject,
		zIndex: 0,
	},
	lottie: {
		height: '100%',
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		marginTop: 'auto',
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		height: 250,
		width: 200,
	},
	image1: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '14%',
		transform: [{ scaleX: -1 }, { rotate: '-10deg' }],
		zIndex: 1,
	},
	image2: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '-17%',
		transform: [{ scaleX: -1 }],
	},
	image3: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '12%',
		left: '12%',
		transform: [{ scaleX: 1 }, { rotate: '210deg' }],
		zIndex: 2,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		zIndex: 1,
	},
	button: {
		flex: 1,
	},
});

export default memo(OrangeTicket);
