import actions from '../actions/actions';
import { ISettings } from '../types/settings';
import { defaultSettingsShape } from '../shapes/settings';
import { EAvailableNetworks } from '../../utils/networks';

const settings = (
	state: ISettings = defaultSettingsShape,
	action,
): ISettings => {
	let selectedNetwork = EAvailableNetworks.bitcoin;
	if (action.payload?.selectedNetwork) {
		selectedNetwork = action.payload.selectedNetwork;
	}

	switch (action.type) {
		case actions.UPDATE_SETTINGS: {
			return {
				...state,
				...action.payload,
			};
		}

		case actions.UPDATE_ELECTRUM_PEERS: {
			return {
				...state,
				customElectrumPeers: {
					...state.customElectrumPeers,
					[selectedNetwork]: action.payload.customElectrumPeers,
				},
			};
		}

		case actions.ADD_TREASURE_CHEST: {
			return {
				...state,
				treasureChests: [...state.treasureChests, action.payload],
			};
		}

		case actions.UPDATE_TREASURE_CHEST: {
			const { chestId } = action.payload;
			const current = state.treasureChests.find((c) => c.chestId === chestId);
			const updatedChest = { ...current, ...action.payload };

			// replace old data while keeping the order
			const updatedChests = state.treasureChests.map((chest) => {
				return chest === current ? updatedChest : chest;
			});

			return {
				...state,
				treasureChests: updatedChests,
			};
		}

		case actions.RESET_SETTINGS_STORE: {
			return defaultSettingsShape;
		}

		default: {
			return state;
		}
	}
};

export default settings;
