import React, { memo, ReactElement } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { Caption13Up } from '../styles/components';
import Store from '../store/types';
import { useBalance } from '../hooks/wallet';
import { updateSettings } from '../store/actions/settings';
import Money from './Money';

/**
 * Displays the total available balance for the current wallet & network.
 */
const BalanceHeader = (): ReactElement => {
	const balanceUnit = useSelector((store: Store) => store.settings.balanceUnit);
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

	return (
		<TouchableOpacity style={styles.container} onPress={handlePress}>
			<Caption13Up style={styles.title} color="gray">
				TOTAL BALANCE
			</Caption13Up>
			<Money
				sats={satoshis}
				unit={balanceUnit}
				highlight={true}
				symbol={true}
			/>
		</TouchableOpacity>
	);
};

export default memo(BalanceHeader);

const styles = StyleSheet.create({
	title: {
		marginBottom: 4,
	},
	container: {
		flex: 1,
		justifyContent: 'flex-start',
		marginTop: 32,
		marginHorizontal: 16,
	},
});
