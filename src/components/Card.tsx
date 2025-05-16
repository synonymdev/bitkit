import {
	Canvas,
	LinearGradient,
	RoundedRect,
	vec,
} from '@shopify/react-native-skia';
import React, { memo, ReactElement, useMemo } from 'react';
import {
	Image,
	ImageSourcePropType,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';

import { IColors } from '../styles/colors';
import { Pressable, View as ThemedView } from '../styles/components';
import { BodyMSB, CaptionB } from '../styles/text';

const CARD_SIZE = 164;
const CARD_BORDER_RADIUS = 16;
const GLOW_OFFSET = 25;

const Shade = memo(({ size = CARD_SIZE }: { size?: number }): ReactElement => {
	return (
		<View
			style={[
				styles.canvasWrapper,
				{ width: size * 1.25, height: size * 1.25 },
			]}>
			<Canvas style={styles.canvas}>
				<RoundedRect
					x={GLOW_OFFSET}
					y={GLOW_OFFSET}
					width={size}
					height={size}
					r={CARD_BORDER_RADIUS}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, size)}
						positions={[0.4, 1]}
						colors={['transparent', 'black']}
					/>
				</RoundedRect>
			</Canvas>
		</View>
	);
});

type CardProps = {
	title: string;
	description: string;
	color: keyof IColors;
	image: ImageSourcePropType;
	size?: number;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress: () => void;
};

const Card = ({
	color,
	image,
	title,
	description,
	size = CARD_SIZE,
	style,
	testID,
	onPress,
}: CardProps): ReactElement => {
	const containerStyle = useMemo(
		() => [styles.container, { width: size, height: size }, style],
		[style, size],
	);

	return (
		<ThemedView style={containerStyle} color={color} testID={`Card-${testID}`}>
			<Shade size={size} />

			<Pressable style={styles.pressable} color="transparent" onPress={onPress}>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={image} resizeMode="contain" />
				</View>
				<View>
					<BodyMSB style={styles.title}>{title}</BodyMSB>
					<CaptionB color="secondary" numberOfLines={1}>
						{description}
					</CaptionB>
				</View>
			</Pressable>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		alignSelf: 'center',
		borderRadius: CARD_BORDER_RADIUS,
		paddingHorizontal: 15,
		paddingVertical: 10,
	},
	pressable: {
		flex: 1,
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		height: 100,
		width: 100,
	},
	canvasWrapper: {
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

export default memo(Card);
