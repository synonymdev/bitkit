import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TransferIcon } from '../../../styles/icons';
import { Title, Caption13M } from '../../../styles/text';
import Money from '../../../components/Money';

const NetworkRow = ({
	title,
	balance,
	pendingBalance,
	icon,
}: {
	title: string;
	balance: number;
	pendingBalance?: number;
	icon: ReactElement;
}): ReactElement => {
	const { t } = useTranslation('wallet');

	return (
		<View style={styles.root}>
			<View>{icon}</View>
			<View>
				<Title>{title}</Title>
				{pendingBalance !== 0 && (
					<View style={styles.subtitle}>
						<TransferIcon style={styles.subtitleIcon} color="white50" />
						<Caption13M color="white50">
							{t('details_transfer_subtitle')}
						</Caption13M>
					</View>
				)}
			</View>
			<View style={styles.amount}>
				<Money sats={balance} size="title" enableHide={true} symbol={true} />
				{pendingBalance ? (
					<View style={styles.pendingBalance}>
						<Money
							style={styles.pendingBalanceAmount}
							sats={pendingBalance}
							size="caption13M"
							color="white50"
							enableHide={true}
						/>
					</View>
				) : null}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	subtitle: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	subtitleIcon: {
		marginRight: 3,
	},
	amount: {
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginLeft: 'auto',
	},
	pendingBalance: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	pendingBalanceAmount: {
		marginLeft: 4,
	},
});

export default NetworkRow;
