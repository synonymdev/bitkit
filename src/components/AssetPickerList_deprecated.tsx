import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, Image, View, TouchableOpacity } from 'react-native';

import { Caption13Up, Text01M, Subtitle } from '../styles/text';
import { SpeedFastIcon, SpeedNormalIcon } from '../styles/icons';
import { getAssetNames } from '../utils/wallet';
import { capitalize } from '../utils/helpers';
import NavigationHeader from './NavigationHeader';
import Glow from './Glow';

const Asset = memo(
	({
		index,
		name,
		side,
		onPress,
	}: {
		index: number;
		name: string;
		side: 'send' | 'receive';
		onPress(): void;
	}) => {
		const assetsInfo = {
			bitcoin: {
				icon: <SpeedNormalIcon color="brand" />,
				title: 'Normal',
				description:
					side === 'send'
						? 'Send via QR code or Bitcoin address. Confirmation may take up to 1 hour.'
						: 'Receive via QR code or Bitcoin address. Confirmation may take up to 1 hour.',
			},
			lightning: {
				icon: <SpeedFastIcon color="purple" />,
				title: 'Instant',
				description:
					side === 'send'
						? 'Create an instant invoice to send Bitcoin in just a few seconds.'
						: 'Create an instant invoice to receive Bitcoin in just a few seconds.',
			},
		};

		return (
			<TouchableOpacity
				style={
					index % 2 === 0
						? [styles.assertRoot, styles.border]
						: [styles.assertRoot]
				}
				onPress={onPress}>
				<View style={styles.leftColumn}>
					<View style={styles.icon}>{assetsInfo[name].icon}</View>
				</View>
				<View style={styles.rightColumn}>
					<Text01M>{capitalize(assetsInfo[name].title)}</Text01M>
					<Subtitle color="gray1">{assetsInfo[name].description}</Subtitle>
				</View>
			</TouchableOpacity>
		);
	},
);

const AssetPickerList = ({
	headerTitle,
	onAssetPress = (): null => null,
	side = 'send',
}: {
	side?: 'send' | 'receive';
	headerTitle?: string;
	onAssetPress?: Function;
}): ReactElement => {
	const assetNames = useMemo(() => getAssetNames({}), []);

	return (
		<View style={styles.container}>
			{headerTitle && (
				<NavigationHeader
					title={headerTitle}
					navigateBack={false}
					displayBackButton={false}
					size="sm"
				/>
			)}
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.title}>
					SPEED
				</Caption13Up>
				{assetNames.map((asset, index) => (
					<Asset
						index={index}
						key={asset}
						name={asset}
						side={side}
						onPress={(): void => onAssetPress(asset)}
					/>
				))}
			</View>
			<View style={styles.imageContainer} pointerEvents="none">
				<Glow style={styles.glow} size={300} color="white" />
				<Image
					style={styles.image}
					source={require('../assets/illustrations/coins.png')}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 15,
	},
	title: {
		marginBottom: 10,
	},
	glow: {
		position: 'absolute',
	},
	imageContainer: {
		position: 'relative',
		alignSelf: 'center',
		height: 300,
		width: 300,
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		height: 300,
		width: 300,
	},
	border: {
		borderBottomWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	assertRoot: {
		flexDirection: 'row',
		paddingTop: 15,
		paddingBottom: 15,
	},
	leftColumn: {
		justifyContent: 'center',
		flexDirection: 'row',
		width: '17%',
	},
	rightColumn: {
		alignItems: 'flex-start',
		flexDirection: 'column',
		flex: 1,
		maxWidth: 250,
	},
	icon: {
		borderRadius: 200,
		marginRight: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(AssetPickerList);
