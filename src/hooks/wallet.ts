import { Wallet as TWallet } from 'beignet';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { TBalance, balanceSelector } from '../store/reselect/aggregations';
import { nextUnitSelector, unitSelector } from '../store/reselect/settings';
import { ignoresSwitchUnitToastSelector } from '../store/reselect/user';
import { updateSettings } from '../store/slices/settings';
import { ignoreSwitchUnitToast } from '../store/slices/user';
import { EUnit } from '../store/types/wallet';
import i18n from '../utils/i18n';
import { showToast } from '../utils/notifications';
import { getOnChainWalletAsync } from '../utils/wallet';
import { useCurrency } from './displayValues';

/**
 * Retrieves wallet balances for the currently selected wallet and network.
 */
export const useBalance = (): TBalance => {
	return useAppSelector(balanceSelector);
};

export const useSwitchUnit = (): (() => void) => {
	const dispatch = useAppDispatch();
	const nextUnit = useAppSelector(nextUnitSelector);

	const switchUnit = (): void => {
		dispatch(updateSettings({ unit: nextUnit }));
	};

	return switchUnit;
};

export const useSwitchUnitAnnounced = (): (() => void) => {
	const dispatch = useAppDispatch();
	const switchUnit = useSwitchUnit();
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const ignoresSwitchUnitToast = useAppSelector(ignoresSwitchUnitToastSelector);
	const { fiatTicker } = useCurrency();
	const { t } = useTranslation('wallet');

	const toUnitText = (u: EUnit): string => {
		if (u === EUnit.BTC) {
			return i18n.t('settings:general.unit_bitcoin');
		}

		return fiatTicker;
	};

	const switchUnitAnnounced = (): void => {
		switchUnit();
		if (!ignoresSwitchUnitToast) {
			showToast({
				type: 'info',
				title: t('balance_unit_switched_title', { unit: toUnitText(nextUnit) }),
				description: t('balance_unit_switched_message', {
					unit: toUnitText(unit),
				}),
				visibilityTime: 5000,
			});
			dispatch(ignoreSwitchUnitToast());
		}
	};

	return switchUnitAnnounced;
};

/**
 * Wait for the onchain wallet to be loaded.
 */
export const useOnchainWallet = (): { wallet: TWallet | null } => {
	const [wallet, setWallet] = useState<TWallet | null>(null);

	useEffect(() => {
		const getWallet = async (): Promise<void> => {
			const w = await getOnChainWalletAsync();
			setWallet(w);
		};

		getWallet();
	}, []);

	return {
		wallet,
	};
};
