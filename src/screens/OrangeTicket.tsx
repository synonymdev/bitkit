import React, { memo, ReactElement, useCallback, useEffect } from 'react';
import { ldk } from '@synonymdev/react-native-ldk';

import { useAppSelector } from '../hooks/redux';
import { useLightningMaxInboundCapacity } from '../hooks/lightning';
import { showToast } from '../utils/notifications';
import { getNodeIdFromStorage, waitForLdk } from '../utils/lightning';
import { viewControllerSelector } from '../store/reselect/ui';
import { createLightningInvoice } from '../store/utils/lightning';
import { __TREASURE_HUNT_HOST__ } from '../constants/env';

const OrangeTicket = (): ReactElement => {
	const maxInboundCapacitySat = useLightningMaxInboundCapacity();
	const { isOpen, ticketId } = useAppSelector((state) => {
		return viewControllerSelector(state, 'orangeTicket');
	});

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

		const openResponse = await openChest();
		if (openResponse.error) {
			return;
		}

		const claimResponse = await claimPrize();
		if (claimResponse.error) {
			return;
		}
	}, [ticketId, maxInboundCapacitySat]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		getPrize();
	}, [isOpen, getPrize]);

	return <></>;
};

export default memo(OrangeTicket);
