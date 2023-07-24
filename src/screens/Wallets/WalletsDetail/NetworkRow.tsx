import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';

import { IColors } from '../../../styles/colors';
import { ClockIcon, LockIcon } from '../../../styles/icons';
import { Caption13M, Text01M } from '../../../styles/text';
import Money from '../../../components/Money';

const NetworkRow = ({
	title,
	subtitle,
	balance,
	pendingBalance,
	reserveBalance,
	color,
	icon,
}: {
	title: string;
	subtitle: string;
	balance: number;
	pendingBalance?: number;
	reserveBalance?: number;
	color: keyof IColors;
	icon: ReactElement;
}): ReactElement => {
	return (
		<View style={styles.root}>
			{icon}
			<View style={styles.text}>
				<Text01M>{title}</Text01M>
				<Caption13M color="gray1">{subtitle}</Caption13M>
			</View>
			<View style={styles.amount}>
				<Money sats={balance} size="text01m" enableHide={true} />
				{pendingBalance ? (
					<View style={styles.pendingBalance}>
						<ClockIcon color={color} />
						<Money
							style={styles.pendingBalanceAmount}
							sats={pendingBalance}
							size="caption13M"
							color={color}
							enableHide={true}
						/>
					</View>
				) : null}

				{pendingBalance === 0 && reserveBalance ? (
					<View style={styles.pendingBalance}>
						<LockIcon color={color} />
						<Money
							style={styles.pendingBalanceAmount}
							sats={reserveBalance}
							size="caption13M"
							color={color}
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
		minHeight: 40,
	},
	text: {
		justifyContent: 'space-between',
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
