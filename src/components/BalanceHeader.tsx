import React, { memo, ReactElement } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Caption13Up, EyeIcon } from '../styles/components';
import Store from '../store/types';
import { useBalance } from '../hooks/wallet';
import { updateSettings } from '../store/actions/settings';
import Money from './Money';

/**
 * Displays the total available balance for the current wallet & network.
 */
const BalanceHeader = (): ReactElement => {
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

	return (
		<TouchableOpacity style={styles.container} onPress={handlePress}>
			<Caption13Up style={styles.title} color="gray1">
				Total balance
			</Caption13Up>
			<View style={styles.row}>
				<Money
					sats={satoshis}
					unit={balanceUnit}
					enableHide={true}
					highlight={true}
					symbol={true}
				/>
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
	title: {
		marginBottom: 9,
	},
	container: {
		flex: 1,
		justifyContent: 'flex-start',
		marginTop: 32,
		paddingLeft: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: 41,
	},
	toggle: {
		paddingRight: 16,
	},
});
