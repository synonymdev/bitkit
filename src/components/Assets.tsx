import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { BitcoinCircleIcon, Subtitle } from '../styles/components';
import { useBalance } from '../hooks/wallet';
import AssetCard from './AssetCard';
import type { WalletNavigationProp } from '../navigation/wallet/WalletNavigator';

const Assets = (): ReactElement => {
	const navigation = useNavigation<WalletNavigationProp>();
	const { satoshis } = useBalance({ onchain: true, lightning: true });

	return (
		<>
			<Subtitle style={styles.title}>Assets</Subtitle>
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
