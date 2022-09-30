import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { BitcoinCircleIcon, Subtitle } from '../styles/components';
import { useBalance } from '../hooks/wallet';
import AssetCard from './AssetCard';

const Assets = ({ navigation }): ReactElement => {
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
