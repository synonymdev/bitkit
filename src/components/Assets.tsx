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
	const navigation = useNavigation<WalletNavigationProp>();
	const { satoshis } = useBalance({ onchain: true, lightning: true });
	const { t } = useTranslation('wallet');

	return (
		<>
			<Caption13Up color="gray1" style={styles.title} testID="AssetsTitle">
				{t('assets')}
			</Caption13Up>
			<AssetCard
				name="Bitcoin"
				testID="BitcoinAsset"
				ticker="BTC"
				satoshis={satoshis}
				icon={<BitcoinCircleIcon color="bitcoin" />}
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
		marginTop: 32,
		marginBottom: 23,
	},
});

export default memo(Assets);
