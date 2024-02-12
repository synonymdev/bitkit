import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Caption13Up } from '../styles/text';
import { BitcoinCircleIcon } from '../styles/icons';
import { useBalance } from '../hooks/wallet';
import AssetCard from './AssetCard';
import type { WalletNavigationProp } from '../navigation/wallet/WalletNavigator';

const Assets = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<WalletNavigationProp>();
	const { totalBalance } = useBalance();

	return (
		<>
			<Caption13Up style={styles.title} color="gray1" testID="AssetsTitle">
				{t('assets')}
			</Caption13Up>
			<AssetCard
				name="Bitcoin"
				ticker="BTC"
				satoshis={totalBalance}
				icon={<BitcoinCircleIcon color="bitcoin" />}
				testID="BitcoinAsset"
				onPress={(): void => {
					navigation.navigate('WalletsDetail', {
						assetType: 'bitcoin',
					});
				}}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	title: {
		marginTop: 26,
		marginBottom: 23,
	},
});

export default memo(Assets);
