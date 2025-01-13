import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { EAvailableNetwork } from '../../utils/networks';
import { getNetworkContent } from '../shapes/wallet';
import { IChecksContent, IChecksShape, TStorageWarning } from '../types/checks';
import { IWallets, TWalletName } from '../types/wallet';
import { createWallet } from './wallet';

type TPayload = {
	warning: TStorageWarning;
	selectedWallet: TWalletName;
	selectedNetwork: EAvailableNetwork;
};

const defaultChecksContent: IChecksContent = {
	warnings: getNetworkContent([]),
};

export const initialChecksState: IChecksShape = {
	wallet0: defaultChecksContent,
};

export const checksSlice = createSlice({
	name: 'checks',
	initialState: initialChecksState,
	reducers: {
		addWarning: (state, action: PayloadAction<TPayload>) => {
			const { selectedWallet, selectedNetwork, warning } = action.payload;
			state[selectedWallet].warnings[selectedNetwork].push(warning);
		},
		updateWarning: (state, action: PayloadAction<TPayload>) => {
			const { selectedWallet, selectedNetwork, warning } = action.payload;
			const current = state[selectedWallet].warnings[selectedNetwork];
			const updated = current.map((w) => {
				if (w.id === warning.id) {
					return { ...w, ...warning };
				}
				return warning;
			});

			state[selectedWallet].warnings[selectedNetwork] = updated;
		},
		resetChecksState: () => initialChecksState,
	},
	extraReducers: (builder) => {
		builder.addCase(createWallet, (state, action: PayloadAction<IWallets>) => {
			const walletName = Object.keys(action.payload)[0];
			state[walletName] = defaultChecksContent;
		});
	},
});

const { actions, reducer } = checksSlice;

export const { addWarning, updateWarning, resetChecksState } = actions;

export default reducer;
