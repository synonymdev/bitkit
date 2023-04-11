import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up } from '../styles/text';
import { EyeIcon } from '../styles/icons';
import Store from '../store/types';
import { useBalance } from '../hooks/wallet';
import { updateSettings } from '../store/actions/settings';
import Money from './Money';
import { claimableBalanceSelector } from '../store/reselect/lightning';
import { EBalanceUnit, EBitcoinUnit } from '../store/types/wallet';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../store/reselect/wallet';
import {
	balanceUnitSelector,
	hideBalanceSelector,
} from '../store/reselect/settings';

/**
 * Displays the total available balance for the current wallet & network.
 */
const BalanceHeader = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const balanceUnit = useSelector(balanceUnitSelector);
	const hideBalance = useSelector(hideBalanceSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const claimableBalance = useSelector((state: Store) =>
		claimableBalanceSelector(state, selectedWallet, selectedNetwork),
	);
	const { satoshis } = useBalance({
		onchain: true,
		lightning: true,
	});

	const handlePress = (): void => {
		// BTC -> satoshi -> fiat
		const nextUnit =
			balanceUnit === EBalanceUnit.BTC
				? EBalanceUnit.satoshi
				: balanceUnit === EBalanceUnit.satoshi
				? EBalanceUnit.fiat
				: EBalanceUnit.BTC;

		const payload = {
			balanceUnit: nextUnit,
			...(nextUnit !== EBalanceUnit.fiat && {
				bitcoinUnit: nextUnit as unknown as EBitcoinUnit,
			}),
		};
		updateSettings(payload);
	};

	const toggleHideBalance = (): void => {
		updateSettings({ hideBalance: !hideBalance });
	};

	const totalBalance = useMemo(() => {
		return satoshis + claimableBalance;
	}, [claimableBalance, satoshis]);

	const showClaimableBalances = useMemo(() => {
		return claimableBalance > 0;
	}, [claimableBalance]);

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={handlePress}
			testID="TotalBalance">
			<View style={styles.totalBalanceRow}>
				{showClaimableBalances ? (
					<Trans
						t={t}
						i18nKey="balance_total_pending"
						components={{
							text: <Caption13Up color="gray1" />,
							pending: (
								<Money
									color="gray1"
									size="caption13M"
									sats={claimableBalance}
									unit={balanceUnit}
									enableHide={true}
									symbol={false}
								/>
							),
						}}
					/>
				) : (
					<Caption13Up color="gray1">{t('balance_total')}</Caption13Up>
				)}
			</View>

			<View style={styles.row}>
				<View>
					<Money
						sats={totalBalance}
						unit={balanceUnit}
						enableHide={true}
						highlight={true}
						symbol={true}
					/>
				</View>
				{hideBalance && (
					<TouchableOpacity style={styles.toggle} onPress={toggleHideBalance}>
						<EyeIcon />
					</TouchableOpacity>
				)}
			</View>
		</TouchableOpacity>
	);
};

export default memo(BalanceHeader);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: 32,
		paddingLeft: 16,
	},
	row: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	totalBalanceRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	toggle: {
		paddingRight: 16,
	},
});
