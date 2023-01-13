import { TInvoice } from '@synonymdev/react-native-ldk';
import actions from '../actions/actions';
import { ILightning } from '../types/lightning';
import { defaultLightningStoreShape } from '../shapes/lightning';
import { EPaymentType } from '../types/wallet';

const lightning = (
	state: ILightning = defaultLightningStoreShape,
	action,
): ILightning => {
	let selectedWallet;
	let selectedNetwork;
	if (action?.payload?.selectedWallet) {
		selectedWallet = action?.payload?.selectedWallet;
	}
	if (action?.payload?.selectedNetwork) {
		selectedNetwork = action.payload.selectedNetwork;
	}

	switch (action.type) {
		case actions.UPDATE_LIGHTNING:
			return {
				...state,
				...action.payload,
			};

		case actions.UPDATE_LIGHTNING_NODE_ID:
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						nodeId: {
							...state.nodes[selectedWallet].nodeId,
							[selectedNetwork]: action.payload?.nodeId ?? '',
						},
					},
				},
			};

		case actions.UPDATE_LIGHTNING_CHANNELS:
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						channels: {
							...state.nodes[selectedWallet].channels,
							[selectedNetwork]: {
								...state.nodes[selectedWallet].channels[selectedNetwork],
								...(action.payload?.channels ?? {}),
							},
						},
						openChannelIds: {
							...state.nodes[selectedWallet].openChannelIds,
							[selectedNetwork]: action.payload?.openChannelIds ?? [],
						},
					},
				},
			};

		case actions.UPDATE_LIGHTNING_NODE_VERSION:
			return {
				...state,
				version: action.payload?.version,
			};

		case actions.ADD_LIGHTNING_INVOICE:
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						invoices: {
							...state.nodes[selectedWallet].invoices,
							[selectedNetwork]: [
								...state.nodes[selectedWallet].invoices[selectedNetwork],
								action.payload.invoice,
							],
						},
					},
				},
			};

		case actions.REMOVE_LIGHTNING_INVOICE:
			const invoices = state.nodes[selectedWallet].invoices[selectedNetwork];
			const newInvoices = invoices.filter(
				(invoice) => invoice.payment_hash !== action.payload.paymentHash,
			);
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						invoices: {
							...state.nodes[selectedWallet].invoices,
							[selectedNetwork]: newInvoices,
						},
					},
				},
			};

		case actions.ADD_LIGHTNING_PAYMENT:
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						payments: {
							...state.nodes[selectedWallet].payments,
							[selectedNetwork]: {
								...state.nodes[selectedWallet].payments[selectedNetwork],
								[action.payload.invoice.payment_hash]: {
									invoice: action.payload.invoice,
									type:
										action.payload.invoice.payee_pub_key ===
										state.nodes[selectedWallet].nodeId[selectedNetwork]
											? EPaymentType.sent
											: EPaymentType.received,
								},
							},
						},
					},
				},
			};

		case actions.REMOVE_EXPIRED_LIGHTNING_INVOICES:
			const t = Math.floor(Date.now() / 1000);
			const currentInvoices = state.nodes[selectedWallet].invoices[
				selectedNetwork
			].filter((i: TInvoice) => i.timestamp + i.expiry_time > t);
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						invoices: {
							...state.nodes[selectedWallet].invoices,
							[selectedNetwork]: currentInvoices,
						},
					},
				},
			};

		case actions.SAVE_LIGHTNING_PEER:
			let peers = state.nodes[selectedWallet]?.peers[selectedNetwork] ?? [];
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						peers: {
							...state.nodes[selectedWallet]?.peers,
							[selectedNetwork]: [...peers, action.payload.peer],
						},
					},
				},
			};

		case actions.REMOVE_LIGHTNING_PEER:
			let newPeers: string[] = state.nodes[selectedWallet]?.peers[
				selectedNetwork
			].filter((existingPeer) => existingPeer !== action.payload.peer);
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						peers: {
							...state.nodes[selectedWallet]?.peers,
							[selectedNetwork]: newPeers,
						},
					},
				},
			};

		case actions.UPDATE_CLAIMABLE_BALANCE:
			return {
				...state,
				nodes: {
					...state.nodes,
					[selectedWallet]: {
						...state.nodes[selectedWallet],
						claimableBalance: {
							...state.nodes[selectedWallet]?.claimableBalance,
							[selectedNetwork]: action.payload.claimableBalance,
						},
					},
				},
			};

		case actions.RESET_LIGHTNING_STORE:
			return defaultLightningStoreShape;

		default:
			return state;
	}
};

export default lightning;
