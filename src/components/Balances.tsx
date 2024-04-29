import React, { memo, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView, Pressable } from '../styles/components';
import {
	TransferIcon,
	BitcoinCircleIcon,
	LightningCircleIcon,
} from '../styles/icons';
import NetworkRow from './NetworkRow';
import { useBalance } from '../hooks/wallet';
import { useAppSelector } from '../hooks/redux';
import { RootNavigationProp } from '../navigation/types';
import { isGeoBlockedSelector } from '../store/reselect/user';
import { accountVersionSelector } from '../store/reselect/lightning';
import { showToast } from '../utils/notifications';

const Balances = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const isGeoBlocked = useAppSelector(isGeoBlockedSelector);
	const accountVersion = useAppSelector(accountVersionSelector);
	const {
		onchainBalance,
		lightningBalance,
		balanceInTransferToSpending,
		balanceInTransferToSavings,
	} = useBalance();

	const canTransfer = (onchainBalance || lightningBalance) && !isGeoBlocked;

	const onSavingsPress = (): void => {
		navigation.navigate('Wallet', { screen: 'ActivitySavings' });
	};

	const onSpendingPress = (): void => {
		navigation.navigate('Wallet', { screen: 'ActivitySpending' });
	};

	const onTransfer = (): void => {
		if (accountVersion < 2) {
			showToast({
				type: 'warning',
				title: t('migrating_ldk_title'),
				description: t('migrating_ldk_description'),
			});
			return;
		}

		if (canTransfer) {
			navigation.navigate('LightningRoot', { screen: 'QuickSetup' });
		}
	};

	return (
		<View style={styles.root}>
			<NetworkRow
				title={t('details_savings_title')}
				balance={onchainBalance}
				pendingBalance={balanceInTransferToSavings}
				icon={<BitcoinCircleIcon color="bitcoin" width={32} height={32} />}
				testID="ActivitySavings"
				onPress={onSavingsPress}
			/>
			<View style={styles.transferRow}>
				<ThemedView style={styles.line} color="white16" />
				<Pressable
					style={styles.transferButton}
					color="white16"
					disabled={!canTransfer}
					testID="TransferButton"
					onPress={onTransfer}>
					<TransferIcon color="white" />
				</Pressable>
				<ThemedView style={styles.line} color="white16" />
			</View>
			<NetworkRow
				title={t('details_spending_title')}
				balance={lightningBalance}
				pendingBalance={balanceInTransferToSpending}
				icon={<LightningCircleIcon width={32} height={32} />}
				testID="ActivitySpending"
				onPress={onSpendingPress}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		marginTop: 32,
	},
	transferRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
	},
	transferButton: {
		paddingHorizontal: 15,
		height: 40,
		borderRadius: 54,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginHorizontal: 16,
	},
	line: {
		flex: 1,
		height: 1,
	},
});

export default memo(Balances);
