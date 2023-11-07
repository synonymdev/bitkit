import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import {
	Canvas,
	RadialGradient,
	vec,
	Box,
	BoxShadow,
	rrect,
	rect,
	RoundedRect,
} from '@shopify/react-native-skia';

import { Pressable } from '../styles/components';
import { Caption13M, Text01M } from '../styles/text';
import { XIcon } from '../styles/icons';
import { ITodo, TTodoType } from '../store/types/todos';
import useColors from '../hooks/colors';
import Card from './Card';

const CARD_SIZE = 152;
const CARD_BORDER_RADIUS = 16;
const GLOW_OFFSET = 25;

const Glow = memo(({ color }: { color: string }): ReactElement => {
	return (
		<RoundedRect
			x={GLOW_OFFSET}
			y={GLOW_OFFSET}
			width={CARD_SIZE}
			height={CARD_SIZE}
			r={CARD_BORDER_RADIUS}
			opacity={0.3}>
			<RadialGradient c={vec(0, 0)} r={250} colors={[color, 'black']} />
		</RoundedRect>
	);
});

const IntenseGlow = memo((): ReactElement => {
	const shadowBlur = 15;
	const shadowSpread = 5;
	const borderSpread = 1;

	return (
		<Box
			box={rrect(
				rect(GLOW_OFFSET, GLOW_OFFSET, CARD_SIZE - 2, CARD_SIZE - 2),
				CARD_BORDER_RADIUS,
				CARD_BORDER_RADIUS,
			)}>
			<BoxShadow
				blur={shadowBlur}
				spread={shadowSpread}
				color="rgb(130, 65, 175)"
			/>
			<BoxShadow
				blur={shadowBlur}
				spread={shadowSpread}
				color="rgb(130, 65, 175)"
				inner
			/>
			<BoxShadow
				blur={borderSpread}
				spread={borderSpread}
				color="rgb(185, 92, 232)"
			/>
		</Box>
	);
});

type CardProps = ITodo & {
	title: string;
	description: string;
	onPress: (id: TTodoType) => void;
	onClose: (id: TTodoType) => void;
};

const SuggestionCard = ({
	id,
	color,
	image,
	title,
	description,
	dismissable,
	onPress,
	onClose,
}: CardProps): ReactElement => {
	const colors = useColors();
	const glowOpacity = useSharedValue(0);

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

	useEffect(() => {
		glowOpacity.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
	}, [glowOpacity]);

	return (
		<Card style={containerStyle} testID={`Suggestion-${id}`}>
			{dismissable ? (
				<View style={styles.glowWrapper}>
					<Canvas style={styles.canvas}>
						<Glow color={colors[color]} />
					</Canvas>
				</View>
			) : (
				<>
					<Animated.View style={[styles.glowWrapper, { opacity: glowOpacity }]}>
						<Canvas style={styles.canvas}>
							<IntenseGlow />
						</Canvas>
					</Animated.View>
					<View style={styles.glowWrapper}>
						<Canvas style={styles.canvas}>
							<RoundedRect
								x={GLOW_OFFSET}
								y={GLOW_OFFSET}
								width={CARD_SIZE}
								height={CARD_SIZE}
								r={CARD_BORDER_RADIUS}
								opacity={0.4}>
								<RadialGradient
									c={vec(100, 100)}
									r={100}
									colors={['rgb(65, 32, 80)', colors[color]]}
								/>
							</RoundedRect>
						</Canvas>
					</View>
				</>
			)}
			<Pressable
				style={styles.pressable}
				color="transparent"
				onPress={(): void => onPress(id)}>
				<View style={styles.iconContainer}>
					<Image style={styles.image} resizeMode="contain" source={image} />
				</View>
				<View>
					<Text01M>{title}</Text01M>
					<Caption13M color={dismissable ? 'lightGray' : 'purple'}>
						{description}
					</Caption13M>
				</View>
			</Pressable>

			{dismissable && (
				<Pressable
					color="transparent"
					style={styles.dismiss}
					onPress={(): void => onClose(id)}
					testID="SuggestionDismiss">
					<XIcon width={18} height={18} color="gray1" />
				</Pressable>
			)}
		</Card>
	);
};

const styles = StyleSheet.create({
	container: {
		width: CARD_SIZE,
		height: CARD_SIZE,
		borderRadius: CARD_BORDER_RADIUS,
		paddingHorizontal: 16,
		paddingBottom: 14,
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
	glowWrapper: {
		width: 200,
		height: 200,
		position: 'absolute',
		top: -GLOW_OFFSET,
		left: -GLOW_OFFSET,
	},
	canvas: {
		flex: 1,
	},
});

export default memo(SuggestionCard);
