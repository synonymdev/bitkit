import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { View, Text02M, Caption13M, EvilIcon } from '../styles/components';
import { StyleSheet } from 'react-native';
import useDisplayValues from '../hooks/displayValues';
import Card from './Card';
import { TAssetNetwork } from '../store/types/wallet';
import { capitalize } from '../utils/helpers';
import { BitcoinCircleIcon, LightningIcon } from '../styles/components';

const AssetPicker = ({
	assetName = 'Bitcoin',
	sats = 0,
	onPress = (): null => null,
	hideArrow = true,
}: {
	assetName?: TAssetNetwork | string;
	sats?: number;
	onPress?: Function;
	hideArrow?: boolean;
}): ReactElement => {
	const balances = useDisplayValues(sats);
	const handleOnPress = useCallback(() => {
		onPress(assetName);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [assetName]);

	const AssetIcon: ReactElement = useMemo(() => {
		switch (assetName) {
			case 'bitcoin':
				return BitcoinCircleIcon;
			case 'lightning':
				return LightningIcon;
			default:
				return BitcoinCircleIcon;
		}
	}, [assetName]);

	const asset = useMemo(() => {
		return capitalize(assetName);
	}, [assetName]);
	return (
		<Card onPress={handleOnPress} style={styles.container} color={'white05'}>
			<>
				<View style={styles.col1}>
					{/*@ts-ignore*/}
					<AssetIcon />
					<View color="transparent" style={styles.titleContainer}>
						<Text02M>{asset}</Text02M>
						<Caption13M color={'gray1'}>
							Balance: {balances.fiatSymbol}
							{balances.fiatFormatted}
						</Caption13M>
					</View>
				</View>

				{hideArrow && (
					<View color="transparent" style={styles.col2}>
						<EvilIcon name={'chevron-down'} size={30} color="onBackground" />
					</View>
				)}
			</>
		</Card>
	);
};

const styles = StyleSheet.create({
	container: {
		height: 58,
		marginBottom: 8,
		borderRadius: 20,
		paddingHorizontal: 16,
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
	},
	col1: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		backgroundColor: 'transparent',
	},
	col2: {
		alignContent: 'flex-end',
		backgroundColor: 'transparent',
	},
	titleContainer: {
		marginHorizontal: 12,
	},
});

export default memo(AssetPicker);
