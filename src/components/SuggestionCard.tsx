import React, { memo, ReactElement, useMemo } from 'react';
import { LayoutAnimation, StyleSheet, Image, View } from 'react-native';
import { Canvas, RadialGradient, Rect, vec } from '@shopify/react-native-skia';

import { Pressable } from '../styles/components';
import { Caption13M, Text01M } from '../styles/text';
import { XIcon } from '../styles/icons';
import { ITodo, TTodoType } from '../store/types/todos';
import useColors from '../hooks/colors';
import Card from './Card';

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

type CardProps = ITodo & {
	onPress: (id: TTodoType) => void;
	onClose: (id: TTodoType) => void;
};

const SuggestionCard = ({
	id,
	title,
	description,
	color,
	image,
	dismissable,
	onPress,
	onClose,
}: CardProps): ReactElement => {
	LayoutAnimation.easeInEaseOut();

	const colors = useColors();

	const containerStyle = useMemo(
		() => [
			styles.container,
			!dismissable && {
				borderColor: colors.purple,
				borderWidth: 1,
			},
		],
		[dismissable, colors.purple],
	);

	return (
		<Card style={containerStyle}>
			<Canvas style={styles.canvas}>
				{dismissable ? (
					<Glow color={colors[color]} />
				) : (
					<InnerShadow color={colors[color]} />
				)}
			</Canvas>
			<Pressable
				onPress={(): void => onPress(id)}
				color="transparent"
				style={styles.pressable}>
				<View style={styles.iconContainer}>
					<Image style={styles.image} resizeMode="contain" source={image} />
				</View>
				<View>
					<Text01M>{title}</Text01M>
					<Caption13M color="lightGray">{description}</Caption13M>
				</View>
			</Pressable>

			{dismissable && (
				<Pressable
					color="transparent"
					style={styles.dismiss}
					onPress={(): void => onClose(id)}>
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

export default memo(SuggestionCard);
