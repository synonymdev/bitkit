import React, { memo, ReactElement, useMemo } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Caption13Up, EyeIcon } from '../styles/components';
import Store from '../store/types';
import { useBalance } from '../hooks/wallet';
import { updateSettings } from '../store/actions/settings';
import Money from './Money';
import { useClaimableBalance } from '../hooks/lightning';

/**
 * Displays the total available balance for the current wallet & network.
 */
const BalanceHeader = (): ReactElement => {
	const claimableBalance = useClaimableBalance();
	const balanceUnit = useSelector((store: Store) => store.settings.balanceUnit);
	const hideBalance = useSelector((state: Store) => state.settings.hideBalance);
	const { satoshis } = useBalance({
		onchain: true,
		lightning: true,
	});

	const handlePress = (): void => {
		// BTC -> satoshi -> fiat
		const nextUnit =
			balanceUnit === 'BTC'
				? 'satoshi'
				: balanceUnit === 'satoshi'
				? 'fiat'
				: 'BTC';
		const payload = {
			balanceUnit: nextUnit,
			...(nextUnit !== 'fiat' && { bitcoinUnit: nextUnit }),
		};
		updateSettings(payload);
	};

	const toggleHideBalance = (): void => {
		updateSettings({ hideBalance: !hideBalance });
	};

	// TODO: Remove Platform check once claimable balance patch is in.
	const totalBalance = useMemo(() => {
		if (Platform.OS === 'ios') {
			return satoshis + claimableBalance;
		}
		return satoshis;
	}, [claimableBalance, satoshis]);

	// TODO: Remove Platform check once claimable balance patch is in.
	const showClaimableBalances = useMemo(() => {
		return Platform.OS === 'ios' && claimableBalance > 0;
	}, [claimableBalance]);

	return (
		<TouchableOpacity style={styles.container} onPress={handlePress}>
			<View style={styles.totalBalanceRow}>
				<Caption13Up color="gray1">Total balance</Caption13Up>
				{showClaimableBalances && (
					<>
						<Caption13Up color="gray1"> (</Caption13Up>
						<Money
							color="gray1"
							size="caption13M"
							sats={claimableBalance}
							unit={balanceUnit}
							enableHide={true}
							highlight={true}
							symbol={false}
						/>
						<Caption13Up color="gray1"> PENDING)</Caption13Up>
					</>
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
