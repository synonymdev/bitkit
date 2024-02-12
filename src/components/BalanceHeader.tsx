import React, { memo, ReactElement } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up } from '../styles/text';
import { EyeIcon } from '../styles/icons';
import Money from './Money';
import { useBalance, useSwitchUnitAnnounced } from '../hooks/wallet';
import { updateSettings } from '../store/slices/settings';
import { unitSelector, hideBalanceSelector } from '../store/reselect/settings';

/**
 * Displays the total available balance for the current wallet & network.
 */
const BalanceHeader = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const onSwitchUnit = useSwitchUnitAnnounced();
	const { totalBalance, pendingBalance } = useBalance();
	const dispatch = useAppDispatch();
	const unit = useAppSelector(unitSelector);
	const hideBalance = useAppSelector(hideBalanceSelector);

	const toggleHideBalance = (): void => {
		dispatch(updateSettings({ hideBalance: !hideBalance }));
	};

	return (
		<View style={styles.container}>
			<View style={styles.totalBalanceRow}>
				{pendingBalance ? (
					<Trans
						t={t}
						i18nKey="balance_total_pending"
						components={{
							text: <Caption13Up color="gray1" />,
							pending: (
								<Money
									color="gray1"
									size="caption13Up"
									sats={pendingBalance}
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

			<TouchableOpacity
				style={styles.row}
				testID="TotalBalance"
				onPress={onSwitchUnit}>
				<Money
					sats={totalBalance}
					unit={unit}
					enableHide={true}
					highlight={true}
					symbol={true}
				/>
				{hideBalance && (
					<TouchableOpacity
						style={styles.toggle}
						testID="ShowBalance"
						onPress={toggleHideBalance}>
						<EyeIcon />
					</TouchableOpacity>
				)}
			</TouchableOpacity>
		</View>
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
		paddingTop: 7,
		paddingRight: 16,
	},
});

export default memo(BalanceHeader);
