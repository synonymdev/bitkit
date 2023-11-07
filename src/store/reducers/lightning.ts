import actions from '../actions/actions';
import { ILightning } from '../types/lightning';
import { defaultLightningStoreShape } from '../shapes/lightning';

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

		case actions.UPDATE_LDK_ACCOUNT_VERSION:
			return {
				...state,
				accountVersion: action.payload.accountVersion,
			};

		case actions.RESET_LIGHTNING_STORE:
			return defaultLightningStoreShape;

		default:
			return state;
	}
};

export default lightning;
