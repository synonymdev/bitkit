import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { ldk } from '@synonymdev/react-native-ldk';

import { BodyM } from '../styles/text';
import AmountToggle from '../components/AmountToggle';
import SafeAreaInset from '../components/SafeAreaInset';
import BottomSheetWrapper from '../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../components/BottomSheetNavigationHeader';
import { useAppSelector } from '../hooks/redux';
import { useLightningMaxInboundCapacity } from '../hooks/lightning';
import { useBottomSheetBackPress, useSnapPoints } from '../hooks/bottomSheet';
import { showToast } from '../utils/notifications';
import {
	getNodeId,
	getNodeIdFromStorage,
	waitForLdk,
} from '../utils/lightning';
import { viewControllerSelector } from '../store/reselect/ui';
import { createLightningInvoice } from '../store/utils/lightning';
import { __TREASURE_HUNT_HOST__ } from '../constants/env';

const imageSrc = require('../assets/illustrations/bitcoin-emboss.png');

const OrangeTicket = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const maxInboundCapacitySat = useLightningMaxInboundCapacity();
	const [isLoading, setIsLoading] = useState(true);
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

			const nodeId = await getNodeId();
			const nodePublicKey = nodeId.isOk() ? nodeId.value : '';
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
		setIsLoading(false);
		setAmount(openResponse.amountSat);

		const claimResponse = await claimPrize();
		if (claimResponse.error) {
			return;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ticketId]);

	useEffect(() => {
		if (!isOpen) {
			setIsLoading(true);
			return;
		}

		getPrize();
	}, [isOpen, getPrize]);

	if (isLoading) {
		return <></>;
	}

	return (
		<BottomSheetWrapper view="orangeTicket" snapPoints={snapPoints}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title="Won Bitcoin!"
					displayBackButton={false}
				/>

				<View style={styles.content}>
					{amount && <AmountToggle amount={amount} />}

					<BodyM style={styles.text} color="secondary">
						You've just won some Bitcoin! Your coins will arrive in ±30 seconds.
						Please wait.
					</BodyM>

					<View style={styles.imageContainer}>
						<Image style={styles.image} source={imageSrc} />
					</View>

					<View style={styles.footer}>
						<ActivityIndicator size={34} color="white" />
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
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 32,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	footer: {
		marginTop: 'auto',
		marginBottom: 16,
		width: '100%',
	},
});

export default memo(OrangeTicket);
