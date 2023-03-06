import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Subtitle } from '../styles/text';
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
			<Subtitle style={styles.title} testID="AssetsTitle">
				{t('assets')}
			</Subtitle>
			<AssetCard
				name="Bitcoin"
				ticker="BTC"
				satoshis={satoshis}
				icon={<BitcoinCircleIcon />}
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
		marginBottom: 8,
	},
});

export default memo(Assets);
