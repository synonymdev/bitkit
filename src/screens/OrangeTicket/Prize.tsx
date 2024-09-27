import React, { ReactElement, memo, useCallback, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ldk } from '@synonymdev/react-native-ldk';

import { BodyM } from '../../styles/text';
import AmountToggle from '../../components/AmountToggle';
import SafeAreaInset from '../../components/SafeAreaInset';
import GradientView from '../../components/GradientView';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { ActivityIndicator } from '../../components/ActivityIndicator';
import { useAppDispatch } from '../../hooks/redux';
import { useLightningMaxInboundCapacity } from '../../hooks/lightning';
import { sleep } from '../../utils/helpers';
import { showToast } from '../../utils/notifications';
import { getNodeIdFromStorage } from '../../utils/lightning';
import { addOrangeTicket } from '../../store/slices/settings';
import { createLightningInvoice } from '../../store/utils/lightning';
import { __TREASURE_HUNT_HOST__ } from '../../constants/env';
import type { OrangeTicketScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/bitcoin-emboss.png');

const Prize = ({
	navigation,
	route,
}: OrangeTicketScreenProps<'Prize'>): ReactElement => {
	const { ticketId, amount } = route.params;
	const dispatch = useAppDispatch();
	const maxInboundCapacitySat = useLightningMaxInboundCapacity();

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

		// Give the user some time to read the message
		await sleep(3000);

		const claimResponse = await claimPrize();
		if (claimResponse.error) {
			navigation.replace('Error', { errorCode: claimResponse.code });
			return;
		} else {
			dispatch(addOrangeTicket(ticketId));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ticketId]);

	useEffect(() => {
		getPrize();
	}, [getPrize]);

	return (
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader
				title="Won Bitcoin!"
				displayBackButton={false}
			/>

			<View style={styles.content}>
				<AmountToggle amount={amount} />

				<BodyM style={styles.text} color="secondary">
					You've just won some Bitcoin! Your coins will arrive in ±30 seconds.
					Please wait.
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.footer}>
					<ActivityIndicator size={32} />
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
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
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(Prize);
