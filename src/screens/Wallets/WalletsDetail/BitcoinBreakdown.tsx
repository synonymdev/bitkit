import React, { memo, ReactElement } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { TransferIcon, SavingsIcon, CoinsIcon } from '../../../styles/icons';
import { useBalance } from '../../../hooks/wallet';
import { RootNavigationProp } from '../../../navigation/types';
import { isGeoBlockedSelector } from '../../../store/reselect/user';
import { openChannelIdsSelector } from '../../../store/reselect/lightning';
import NetworkRow from './NetworkRow';

const BitcoinBreakdown = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const isGeoBlocked = useSelector(isGeoBlockedSelector);
	const openChannelIds = useSelector(openChannelIdsSelector);
	const {
		onchainBalance,
		lightningBalance,
		spendingBalance,
		reserveBalance,
		claimableBalance,
	} = useBalance();

	const isTransferToSavings = openChannelIds.length === 0;

	const onRebalancePress = (): void => {
		if (lightningBalance && !isGeoBlocked) {
			navigation.navigate('Transfer', { screen: 'Setup' });
		} else {
			navigation.navigate('LightningRoot', { screen: 'Introduction' });
		}
	};

	return (
		<>
			<NetworkRow
				title={t('details_savings_title')}
				subtitle={t('details_savings_subtitle')}
				balance={onchainBalance}
				pendingBalance={isTransferToSavings ? claimableBalance : 0}
				color="brand"
				icon={
					<ThemedView style={styles.icon} color="brand16">
						<SavingsIcon color="brand" width={17} height={17} />
					</ThemedView>
				}
			/>
			<View style={styles.transferRow}>
				<ThemedView color="gray4" style={styles.line} />
				<TouchableOpacity testID="TransferButton" onPress={onRebalancePress}>
					<ThemedView style={styles.transferButton} color="white08">
						<TransferIcon height={13} color="white" />
					</ThemedView>
				</TouchableOpacity>
				<ThemedView color="gray4" style={styles.line} />
			</View>
			<NetworkRow
				title={t('details_spending_title')}
				subtitle={t('details_spending_subtitle')}
				balance={spendingBalance}
				pendingBalance={isTransferToSavings ? 0 : claimableBalance}
				reserveBalance={reserveBalance}
				color="purple"
				icon={
					<ThemedView style={styles.icon} color="purple16">
						<CoinsIcon color="purple" width={13} height={13} />
					</ThemedView>
				}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	icon: {
		borderRadius: 20,
		height: 32,
		width: 32,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		marginRight: 16,
	},
	transferRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
	},
	transferButton: {
		paddingHorizontal: 15,
		height: 36,
		borderRadius: 34,
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

export default memo(BitcoinBreakdown);
