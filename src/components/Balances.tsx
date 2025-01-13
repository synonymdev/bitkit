import { useNavigation } from '@react-navigation/native';
import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useBalance } from '../hooks/wallet';
import { RootNavigationProp } from '../navigation/types';
import { View as ThemedView } from '../styles/components';
import {
	BitcoinCircleIcon,
	LightningCircleIcon,
	TransferIcon,
} from '../styles/icons';
import { Caption13Up } from '../styles/text';
import Money from './Money';

const Balance = ({
	label,
	balance,
	icon,
	hasPending,
	testID,
	onPress,
}: {
	label: string;
	balance: number;
	icon: ReactElement;
	hasPending?: boolean;
	testID?: string;
	onPress?: () => void;
}): ReactElement => (
	<TouchableOpacity
		style={styles.balance}
		activeOpacity={0.7}
		testID={testID}
		onPress={onPress}>
		<Caption13Up color="secondary">{label}</Caption13Up>
		<View style={styles.content}>
			{icon}
			<Money
				style={styles.amount}
				sats={balance}
				size="bodyMSB"
				enableHide={true}
				symbolColor="white"
			/>
			{hasPending && <TransferIcon color="white50" height={16} width={16} />}
		</View>
	</TouchableOpacity>
);

const Balances = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const {
		onchainBalance,
		lightningBalance,
		balanceInTransferToSpending,
		balanceInTransferToSavings,
	} = useBalance();

	const onSavingsPress = (): void => {
		navigation.navigate('Wallet', { screen: 'ActivitySavings' });
	};

	const onSpendingPress = (): void => {
		navigation.navigate('Wallet', { screen: 'ActivitySpending' });
	};

	return (
		<View style={styles.root}>
			<Balance
				label={t('details_savings_title')}
				balance={onchainBalance}
				icon={<BitcoinCircleIcon width={24} height={24} />}
				hasPending={balanceInTransferToSavings !== 0}
				testID="ActivitySavings"
				onPress={onSavingsPress}
			/>
			<ThemedView style={styles.divider} color="white16" />
			<Balance
				label={t('details_spending_title')}
				balance={lightningBalance}
				icon={<LightningCircleIcon width={24} height={24} />}
				hasPending={balanceInTransferToSpending !== 0}
				testID="ActivitySpending"
				onPress={onSpendingPress}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		marginTop: 22,
		paddingHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	divider: {
		width: 1,
		marginRight: 16,
	},
	balance: {
		flex: 1,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	amount: {
		marginLeft: 8,
		marginRight: 3,
	},
});

export default memo(Balances);
