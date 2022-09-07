import React, { memo, ReactElement } from 'react';
import { LayoutAnimation, StyleSheet, Image, View } from 'react-native';
import { Canvas, RadialGradient, Rect, vec } from '@shopify/react-native-skia';

import { Caption13M, Pressable, Text01M, XIcon } from '../styles/components';
import Card from './Card';
import BitcoinLogo from '../assets/bitcoin-logo.svg';
import { dismissTodo } from '../store/actions/todos';
import useColors from '../hooks/colors';

const Glow = memo(({ color }: { color: string }) => {
	return (
		<Rect x={0} y={0} width={160} height={160} opacity={0.3}>
			<RadialGradient c={vec(0, 0)} r={250} colors={[color, 'black']} />
		</Rect>
	);
});

const CarouselCard = ({
	id = '',
	title = '',
	description = '',
	onPress = (): null => null,
}: {
	id: string;
	title: string;
	description: string;
	onPress?: Function;
}): ReactElement => {
	const colors = useColors();
	LayoutAnimation.easeInEaseOut();

	let icon;
	let color;
	switch (id) {
		case 'lightning':
			icon = (
				<Image
					resizeMode="contain"
					style={styles.image}
					source={require('../assets/illustrations/lightning.png')}
				/>
			);
			color = 'purple';
			break;
		case 'pin':
			icon = (
				<Image
					resizeMode="contain"
					style={styles.image}
					source={require('../assets/illustrations/shield.png')}
				/>
			);
			color = 'green';
			break;
		case 'backupSeedPhrase':
			icon = (
				<Image
					resizeMode="contain"
					style={styles.image}
					source={require('../assets/illustrations/safe.png')}
				/>
			);
			color = 'blue';
			break;
		case 'slashtagsProfile':
			icon = (
				<Image
					resizeMode="contain"
					style={styles.image}
					source={require('../assets/illustrations/crown-no-margins.png')}
				/>
			);
			color = 'brand';
			break;
		default:
			// TODO: Swap out BitcoinLogo with the relevant image based on the provided id.
			icon = (
				<BitcoinLogo viewBox="0 0 70 70" height="32.54px" width="45.52px" />
			);
			color = 'brand';
	}

	color = colors[color] ?? color;

	return (
		<Card style={styles.container}>
			<Canvas style={styles.canvas}>
				<Glow color={color} />
			</Canvas>
			<Pressable onPress={onPress} color="transparent" style={styles.pressable}>
				<View style={styles.iconContainer}>{icon}</View>
				<View>
					<Text01M>{title}</Text01M>
					<Caption13M color="lightGray">{description}</Caption13M>
				</View>
			</Pressable>
			<Pressable
				color="transparent"
				style={styles.dismiss}
				onPress={(): any => dismissTodo(id)}>
				<XIcon width={16} height={16} color="gray1" />
			</Pressable>
		</Card>
	);
};

const styles = StyleSheet.create({
	container: {
		width: 160,
		height: 160,
		borderRadius: 16,
		paddingHorizontal: 16,
		overflow: 'hidden',
	},
	pressable: {
		flex: 1,
	},
	iconContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	dismiss: {
		position: 'absolute',
		top: 3,
		right: 3,
		padding: 16,
	},
	image: {
		height: 80,
		width: 80,
	},
	canvas: {
		width: 160,
		height: 160,
		position: 'absolute',
	},
});

export default memo(CarouselCard);
