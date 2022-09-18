import actions from '../actions/actions';
import { ISettings } from '../types/settings';
import { defaultSettingsShape } from '../shapes/settings';

const settings = (
	state: ISettings = defaultSettingsShape,
	action,
): ISettings => {
	let selectedNetwork = state.selectedNetwork;
	if (action.payload?.selectedNetwork) {
		selectedNetwork = action.payload.selectedNetwork;
	}

	switch (action.type) {
		case actions.UPDATE_SETTINGS:
			return {
				...state,
				...action.payload,
			};

		case actions.UPDATE_ELECTRUM_PEERS:
			return {
				...state,
				customElectrumPeers: {
					...state.customElectrumPeers,
					[selectedNetwork]: action.payload.customElectrumPeers,
				},
			};

		case actions.RESET_SETTINGS_STORE:
			return { ...defaultSettingsShape };

		default:
			return state;
	}
};

export default settings;
