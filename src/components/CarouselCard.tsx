import React, { memo, ReactElement, useMemo } from 'react';
import {
	LayoutAnimation,
	StyleSheet,
	Image,
	View,
	ImageSourcePropType,
} from 'react-native';
import { Canvas, RadialGradient, Rect, vec } from '@shopify/react-native-skia';

import { Caption13M, Pressable, Text01M, XIcon } from '../styles/components';
import Card from './Card';
import { removeTodo } from '../store/actions/todos';
import useColors from '../hooks/colors';
import { TTodoType } from '../store/types/todos';
import { IColors } from '../styles/colors';

const Glow = memo(({ color }: { color: string }): ReactElement => {
	return (
		<Rect x={0} y={0} width={160} height={160} opacity={0.3}>
			<RadialGradient c={vec(0, 0)} r={250} colors={[color, 'black']} />
		</Rect>
	);
});

const InnerShadow = memo(({ color }: { color: string }): ReactElement => {
	return (
		<Rect x={0} y={0} width={160} height={160} opacity={0.3} color={color}>
			<RadialGradient c={vec(80, 80)} r={110} colors={['black', color]} />
		</Rect>
	);
});

const CarouselCard = ({
	id,
	title,
	description,
	color,
	image,
	onPress,
}: {
	id: TTodoType;
	title: string;
	description: string;
	color: keyof IColors;
	image: ImageSourcePropType;
	onPress: () => void;
}): ReactElement => {
	LayoutAnimation.easeInEaseOut();

	const colors = useColors();
	const inverted = id === 'lightningSettingUp';

	const containerStyle = useMemo(
		() => [
			styles.container,
			inverted && {
				borderColor: colors.purple,
				borderWidth: 1,
			},
		],
		[inverted, colors.purple],
	);

	return (
		<Card style={containerStyle}>
			<Canvas style={styles.canvas}>
				{inverted ? (
					<InnerShadow color={colors[color]} />
				) : (
					<Glow color={colors[color]} />
				)}
			</Canvas>
			<Pressable onPress={onPress} color="transparent" style={styles.pressable}>
				<View style={styles.iconContainer}>
					<Image style={styles.image} resizeMode="contain" source={image} />
				</View>
				<View>
					<Text01M>{title}</Text01M>
					<Caption13M color="lightGray">{description}</Caption13M>
				</View>
			</Pressable>
			{id !== 'lightningSettingUp' && (
				<Pressable
					color="transparent"
					style={styles.dismiss}
					onPress={(): void => {
						removeTodo(id);
					}}>
					<XIcon width={18} height={18} color="gray1" />
				</Pressable>
			)}
		</Card>
	);
};

const styles = StyleSheet.create({
	container: {
		width: 160,
		height: 160,
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingBottom: 14,
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
		top: 0,
		right: 0,
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
