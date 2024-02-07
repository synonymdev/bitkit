import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '..';
import themes, { IThemeColors } from '../../styles/themes';
import { TSettings } from '../slices/settings';
import { EAvailableNetwork } from '../../utils/networks';
import { EConversionUnit, EDenomination, EUnit } from '../types/wallet';
import {
	ICustomElectrumPeer,
	TCoinSelectPreference,
	TCustomElectrumPeers,
	TReceiveOption,
	TTheme,
	ETransactionSpeed,
} from '../types/settings';

export const settingsState = (state: RootState): TSettings => state.settings;
const customElectrumPeersState = (state: RootState): TCustomElectrumPeers =>
	state.settings.customElectrumPeers;

export const settingsSelector = (state: RootState): TSettings => state.settings;
export const selectedCurrencySelector = createSelector(
	[settingsState],
	(settings): string => settings.selectedCurrency,
);
export const biometricsSelector = createSelector(
	[settingsState],
	(settings) => settings.biometrics,
);
export const coinSelectAutoSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.coinSelectAuto,
);
export const enableSwipeToHideBalanceSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.enableSwipeToHideBalance,
);
export const hideOnboardingMessageSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.hideOnboardingMessage,
);
export const hideBalanceSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.hideBalance,
);
export const hideBalanceOnOpenSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.hideBalanceOnOpen,
);
export const enableOfflinePaymentsSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.enableOfflinePayments,
);
export const enableDevOptionsSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.enableDevOptions,
);
export const pinSelector = createSelector(
	[settingsState],
	(settings) => settings.pin,
);
export const pinOnLaunchSelector = createSelector(
	[settingsState],
	(settings) => settings.pinOnLaunch,
);
export const pinOnIdleSelector = createSelector(
	[settingsState],
	(settings) => settings.pinOnIdle,
);

export const coinSelectPreferenceSelector = createSelector(
	[settingsState],
	(settings): TCoinSelectPreference => settings.coinSelectPreference,
);

/**
 * Returns custom Electrum peers for a given network.
 * @param {RootState} state
 * @param {EAvailableNetwork} selectedNetwork
 * @returns {ICustomElectrumPeer[]}
 */
export const customElectrumPeersSelector = createSelector(
	[
		customElectrumPeersState,
		(
			_customElectrumPeers,
			selectedNetwork: EAvailableNetwork,
		): EAvailableNetwork => selectedNetwork,
	],
	(customElectrumPeers, selectedNetwork): ICustomElectrumPeer[] =>
		customElectrumPeers[selectedNetwork],
);
export const rapidGossipSyncUrlSelector = createSelector(
	[settingsState],
	(settings): string => settings.rapidGossipSyncUrl,
);
export const transactionSpeedSelector = createSelector(
	[settingsState],
	(settings): ETransactionSpeed => settings.transactionSpeed,
);
export const customFeeRateSelector = createSelector(
	[settingsState],
	(settings): number => settings.customFeeRate,
);
export const showWidgetsSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.showWidgets,
);
export const receivePreferenceSelector = createSelector(
	[settingsState],
	(settings): TReceiveOption[] => settings.receivePreference,
);
export const pinForPaymentsSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.pinForPayments,
);
export const themeSelector = createSelector(
	[settingsState],
	(settings): TTheme => settings.theme,
);
export const themeColorsSelector = createSelector(
	[settingsState],
	(settings): IThemeColors => themes[settings.theme].colors,
);
export const selectedLanguageSelector = createSelector(
	[settingsState],
	(settings): string => settings.selectedLanguage,
);
export const enableAutoReadClipboardSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.enableAutoReadClipboard,
);
export const enableSendAmountWarningSelector = createSelector(
	[settingsState],
	(settings): boolean => settings.enableSendAmountWarning,
);
export const unitSelector = createSelector(
	[settingsState],
	(settings) => settings.unit,
);
export const nextUnitSelector = createSelector([settingsState], (settings) => {
	return settings.unit === EUnit.fiat ? EUnit.BTC : EUnit.fiat;
});
export const conversionUnitSelector = createSelector(
	[settingsState],
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
export const denominationSelector = createSelector(
	[settingsState],
	(settings) => settings.denomination,
);

export enum ENumberPadType {
	decimal = 'decimal',
	integer = 'integer',
}

export const numberPadSelector = createSelector([settingsState], (settings) => {
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
});

export const webRelaySelector = createSelector(
	[settingsState],
	(settings): string => settings.webRelay,
);
