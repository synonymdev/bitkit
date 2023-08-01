import React, { memo, ReactElement } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up } from '../styles/text';
import { EyeIcon } from '../styles/icons';
import Money from './Money';
import { useBalance, useSwitchUnit } from '../hooks/wallet';
import { updateSettings } from '../store/actions/settings';
import {
	primaryUnitSelector,
	hideBalanceSelector,
} from '../store/reselect/settings';

/**
 * Displays the total available balance for the current wallet & network.
 */
const BalanceHeader = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const [_, switchUnit] = useSwitchUnit();
	const { totalBalance, claimableBalance } = useBalance();
	const unit = useSelector(primaryUnitSelector);
	const hideBalance = useSelector(hideBalanceSelector);

	const toggleHideBalance = (): void => {
		updateSettings({ hideBalance: !hideBalance });
	};

	return (
		<TouchableOpacity
			style={styles.container}
			testID="TotalBalance"
			onPress={switchUnit}>
			<View style={styles.totalBalanceRow}>
				{claimableBalance ? (
					<Trans
						t={t}
						i18nKey="balance_total_pending"
						components={{
							text: <Caption13Up color="gray1" />,
							pending: (
								<Money
									color="gray1"
									size="caption13Up"
									sats={claimableBalance}
									unit={unit}
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
						unit={unit}
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

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: 32,
		paddingLeft: 16,
	},
	row: {
		marginTop: 6,
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

export default memo(BalanceHeader);
