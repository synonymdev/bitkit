import React, { memo, ReactElement } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up } from '../styles/text';
import { EyeIcon } from '../styles/icons';
import Money from './Money';
import { useBalance, useSwitchUnitAnnounced } from '../hooks/wallet';
import { updateSettings } from '../store/slices/settings';
import { hideBalanceSelector } from '../store/reselect/settings';

/**
 * Displays the total available balance for the current wallet & network.
 */
const BalanceHeader = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const dispatch = useAppDispatch();
	const onSwitchUnit = useSwitchUnitAnnounced();
	const { totalBalance, pendingPaymentsBalance } = useBalance();
	const hideBalance = useAppSelector(hideBalanceSelector);

	const toggleHideBalance = (): void => {
		dispatch(updateSettings({ hideBalance: !hideBalance }));
	};

	return (
		<View style={styles.container}>
			<View style={styles.label}>
				{pendingPaymentsBalance ? (
					<Trans
						t={t}
						i18nKey="balance_total_pending"
						components={{
							text: <Caption13Up color="secondary" />,
							pending: (
								<Money
									color="secondary"
									size="caption13Up"
									sats={pendingPaymentsBalance}
									enableHide={true}
									symbol={false}
								/>
							),
						}}
					/>
				) : (
					<Caption13Up color="secondary">{t('balance_total')}</Caption13Up>
				)}
			</View>

			<TouchableOpacity
				style={styles.balance}
				testID="TotalBalance"
				onPress={onSwitchUnit}>
				<Money sats={totalBalance} enableHide={true} symbol={true} />
				{hideBalance && (
					<TouchableOpacity
						hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
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
		paddingHorizontal: 16,
	},
	label: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	balance: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
});

export default memo(BalanceHeader);
