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
	LinearGradient,
} from '@shopify/react-native-skia';

import { XIcon } from '../styles/icons';
import { IColors } from '../styles/colors';
import { BodyMSB, CaptionB } from '../styles/text';
import { View as ThemedView, Pressable } from '../styles/components';
import useColors from '../hooks/colors';
import { __E2E__ } from '../constants/env';
import { ITodo, TTodoType } from '../store/types/todos';

const CARD_SIZE = 152;
const CARD_BORDER_RADIUS = 16;
const GLOW_OFFSET = 25;

const Shade = memo((): ReactElement => {
	return (
		<View style={styles.canvasWrapper}>
			<Canvas style={styles.canvas}>
				<RoundedRect
					x={GLOW_OFFSET}
					y={GLOW_OFFSET}
					width={CARD_SIZE}
					height={CARD_SIZE}
					r={CARD_BORDER_RADIUS}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, CARD_SIZE)}
						positions={[0.4, 1]}
						colors={['transparent', 'black']}
					/>
				</RoundedRect>
			</Canvas>
		</View>
	);
});

const Glow = memo(({ color }: { color: keyof IColors }): ReactElement => {
	const colors = useColors();
	const glowOpacity = useSharedValue(0);

	const shadowBlur = 15;
	const shadowSpread = 5;
	const borderSpread = 1;

	useEffect(() => {
		if (__E2E__) {
			return;
		}

		glowOpacity.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
	}, [glowOpacity]);

	let shadowColor = 'rgb(130, 65, 175)';
	let borderColor = 'rgb(185, 92, 232)';
	let gradientColor = 'rgb(65, 32, 80)';

	if (color === 'brand24') {
		shadowColor = 'rgb(200,48,0)';
		borderColor = 'rgb(255,68,0)';
		gradientColor = 'rgb(100, 24, 0)';
	}

	return (
		<>
			<Animated.View style={[styles.canvasWrapper, { opacity: glowOpacity }]}>
				<Canvas style={styles.canvas}>
					<Box
						box={rrect(
							rect(GLOW_OFFSET, GLOW_OFFSET, CARD_SIZE - 2, CARD_SIZE - 2),
							CARD_BORDER_RADIUS,
							CARD_BORDER_RADIUS,
						)}>
						<BoxShadow
							blur={shadowBlur}
							spread={shadowSpread}
							color={shadowColor}
						/>
						<BoxShadow
							blur={shadowBlur}
							spread={shadowSpread}
							color={shadowColor}
							inner
						/>
						<BoxShadow
							blur={borderSpread}
							spread={borderSpread}
							color={borderColor}
						/>
					</Box>
				</Canvas>
			</Animated.View>
			<View style={styles.canvasWrapper}>
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
							colors={[gradientColor, colors[color]]}
						/>
					</RoundedRect>
				</Canvas>
			</View>
		</>
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

	// purple24 -> purple
	const accentColor = color.replace('24', '');
	const captionColor = dismissable ? 'secondary' : accentColor;

	const containerStyle = useMemo(
		() => [
			styles.container,
			!dismissable && { borderColor: colors[accentColor], borderWidth: 1 },
		],
		[dismissable, colors, accentColor],
	);

	return (
		<ThemedView
			style={containerStyle}
			color={color}
			testID={`Suggestion-${id}`}>
			{dismissable ? <Shade /> : <Glow color={color} />}

			<Pressable
				style={styles.pressable}
				color="transparent"
				onPress={(): void => onPress(id)}>
				<View style={styles.iconContainer}>
					<Image style={styles.image} source={image} resizeMode="contain" />
				</View>
				<View>
					<BodyMSB style={styles.title}>{title}</BodyMSB>
					<CaptionB color={captionColor} numberOfLines={1}>
						{description}
					</CaptionB>
				</View>
			</Pressable>

			{dismissable && (
				<Pressable
					color="transparent"
					style={styles.dismiss}
					testID="SuggestionDismiss"
					onPress={(): void => onClose(id)}>
					<XIcon color="secondary" width={18} height={18} />
				</Pressable>
			)}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		width: CARD_SIZE,
		height: CARD_SIZE,
		alignSelf: 'center',
		borderRadius: CARD_BORDER_RADIUS,
		marginVertical: 10,
		paddingHorizontal: 15,
		paddingVertical: 10,
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
	canvasWrapper: {
		width: 200,
		height: 200,
		position: 'absolute',
		top: -GLOW_OFFSET,
		left: -GLOW_OFFSET,
	},
	canvas: {
		flex: 1,
	},
	title: {
		fontFamily: 'InterTight-Black',
		fontSize: 20,
		lineHeight: 20,
		letterSpacing: -0.5,
		textTransform: 'uppercase',
	},
});

export default memo(SuggestionCard);
