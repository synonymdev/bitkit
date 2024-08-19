import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '..';
import themes, { IThemeColors } from '../../styles/themes';
import { TSettings } from '../slices/settings';
import { selectedNetworkSelector } from './wallet';
import { EConversionUnit, EDenomination, EUnit } from '../types/wallet';
import {
	ICustomElectrumPeer,
	TCoinSelectPreference,
	TCustomElectrumPeers,
	TReceiveOption,
	TTheme,
	ETransactionSpeed,
} from '../types/settings';

export const settingsSelector = (state: RootState): TSettings => state.settings;
const customElectrumPeersState = (state: RootState): TCustomElectrumPeers => {
	return state.settings.customElectrumPeers;
};

export const selectedCurrencySelector = (state: RootState): string => {
	return state.settings.selectedCurrency;
};
export const biometricsSelector = (state: RootState): boolean => {
	return state.settings.biometrics;
};
export const coinSelectAutoSelector = (state: RootState): boolean => {
	return state.settings.coinSelectAuto;
};
export const enableStealthModeSelector = (state: RootState): boolean => {
	return state.settings.enableStealthMode;
};
export const enableSwipeToHideBalanceSelector = (state: RootState): boolean => {
	return state.settings.enableSwipeToHideBalance;
};
export const hideOnboardingMessageSelector = (state: RootState): boolean => {
	return state.settings.hideOnboardingMessage;
};
export const hideBalanceSelector = (state: RootState): boolean => {
	return state.settings.hideBalance;
};
export const hideBalanceOnOpenSelector = (state: RootState): boolean => {
	return state.settings.hideBalanceOnOpen;
};
export const enableOfflinePaymentsSelector = (state: RootState): boolean => {
	return state.settings.enableOfflinePayments;
};
export const enableDevOptionsSelector = (state: RootState): boolean => {
	return state.settings.enableDevOptions;
};
export const pinSelector = (state: RootState): boolean => {
	return state.settings.pin;
};
export const pinOnLaunchSelector = (state: RootState): boolean => {
	return state.settings.pinOnLaunch;
};
export const pinOnIdleSelector = (state: RootState): boolean => {
	return state.settings.pinOnIdle;
};
export const coinSelectPreferenceSelector = (
	state: RootState,
): TCoinSelectPreference => {
	return state.settings.coinSelectPreference;
};
export const rapidGossipSyncUrlSelector = (state: RootState): string => {
	return state.settings.rapidGossipSyncUrl;
};
export const transactionSpeedSelector = (
	state: RootState,
): ETransactionSpeed => {
	return state.settings.transactionSpeed;
};
export const customFeeRateSelector = (state: RootState): number => {
	return state.settings.customFeeRate;
};
export const showWidgetsSelector = (state: RootState): boolean => {
	return state.settings.showWidgets;
};
export const showWidgetTitlesSelector = (state: RootState): boolean => {
	return state.settings.showWidgetTitles;
};
export const receivePreferenceSelector = (
	state: RootState,
): TReceiveOption[] => {
	return state.settings.receivePreference;
};
export const pinForPaymentsSelector = (state: RootState): boolean => {
	return state.settings.pinForPayments;
};
export const themeSelector = (state: RootState): TTheme => {
	return state.settings.theme;
};
export const themeColorsSelector = (state: RootState): IThemeColors => {
	return themes[state.settings.theme].colors;
};
export const selectedLanguageSelector = (state: RootState): string => {
	return state.settings.selectedLanguage;
};
export const enableAutoReadClipboardSelector = (state: RootState): boolean => {
	return state.settings.enableAutoReadClipboard;
};
export const enableSendAmountWarningSelector = (state: RootState): boolean => {
	return state.settings.enableSendAmountWarning;
};
export const unitSelector = (state: RootState): EUnit => {
	return state.settings.unit;
};
export const nextUnitSelector = (state: RootState): EUnit => {
	return state.settings.unit === EUnit.fiat ? EUnit.BTC : EUnit.fiat;
};
export const denominationSelector = (state: RootState): EDenomination => {
	return state.settings.denomination;
};
export const webRelaySelector = (state: RootState): string => {
	return state.settings.webRelay;
};

/**
 * Returns custom Electrum peers for a given network.
 * @param {RootState} state
 * @param {EAvailableNetwork} selectedNetwork
 * @returns {ICustomElectrumPeer[]}
 */
export const customElectrumPeersSelector = createSelector(
	[customElectrumPeersState, selectedNetworkSelector],
	(customElectrumPeers, selectedNetwork): ICustomElectrumPeer[] => {
		return customElectrumPeers[selectedNetwork];
	},
);

export const conversionUnitSelector = createSelector(
	[settingsSelector],
	(settings) => {
		const { unit, denomination } = settings;
		if (unit === EUnit.BTC) {
			return denomination === EDenomination.modern
				? EConversionUnit.satoshi
				: EConversionUnit.BTC;
		}
		return EConversionUnit.fiat;
	},
);

export enum ENumberPadType {
	decimal = 'decimal',
	integer = 'integer',
}

export const numberPadSelector = createSelector(
	[settingsSelector],
	(settings) => {
		const { unit, denomination } = settings;
		const isBtc = unit === EUnit.BTC;
		const isModern = denomination === EDenomination.modern;
		const isClassic = denomination === EDenomination.classic;

		const maxLength = isModern && isBtc ? 10 : 20;
		const maxDecimals = isClassic && isBtc ? 8 : 2;
		const type =
			isModern && isBtc ? ENumberPadType.integer : ENumberPadType.decimal;

		return {
			maxLength,
			maxDecimals,
			type,
		};
	},
);
