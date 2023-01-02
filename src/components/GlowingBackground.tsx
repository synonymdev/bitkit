import React, {
	memo,
	ReactElement,
	ReactNode,
	useState,
	useEffect,
} from 'react';
import { StyleSheet } from 'react-native';
import { useWindowDimensions } from 'react-native';
import {
	Canvas,
	RadialGradient,
	Rect,
	runTiming,
	useValue,
	vec,
} from '@shopify/react-native-skia';

import { View } from '../styles/components';
import { IColors } from '../styles/colors';
import useColors from '../hooks/colors';

const DURATION = 500;

const Glow = memo(
	({
		top,
		color,
		fadeout,
		width,
		height,
	}: {
		top?: boolean;
		color: string;
		fadeout: boolean;
		width: number;
		height: number;
	}) => {
		const opacity = useValue(0);

		useEffect(() => {
			runTiming(opacity, fadeout ? 0 : 1, { duration: DURATION });
		}, [opacity, fadeout]);

		return (
			<Rect x={0} y={0} width={width} height={height} opacity={opacity}>
				{top ? (
					<RadialGradient
						c={vec(-270, 100)}
						r={600}
						colors={[color, 'transparent']}
					/>
				) : (
					<RadialGradient
						c={vec(width + 118, height + 61)}
						r={width}
						colors={[color, 'transparent']}
					/>
				)}
			</Rect>
		);
	},
);

/**
 * Draws radial gradients. When color changes, shows opacity animation
 */
const GlowingBackground = ({
	children,
	topLeft,
	bottomRight,
}: {
	children: ReactNode;
	topLeft?: keyof IColors;
	bottomRight?: keyof IColors;
}): ReactElement => {
	const { height, width } = useWindowDimensions();
	const colors = useColors();
	const topLeftColor = topLeft ? colors[topLeft] : colors.background;
	const bottomRightColor = bottomRight
		? colors[bottomRight]
		: colors.background;
	const [topLeftItems, setTopLeftItems] = useState([
		{ color: topLeftColor, id: 0 },
	]);
	const [bottomRightItems, setBottomRightItems] = useState([
		{ color: bottomRightColor, id: 0 },
	]);

	useEffect(() => {
		setTopLeftItems((items) => {
			if (items[items.length - 1].color === topLeftColor) {
				return items;
			}
			const id = items[items.length - 1].id + 1;
			return [...items.splice(-4), { color: topLeftColor, id }];
		});
	}, [topLeftColor]);

	useEffect(() => {
		setBottomRightItems((items) => {
			if (items[items.length - 1].color === bottomRightColor) {
				return items;
			}
			const id = items[items.length - 1].id + 1;
			return [...items.splice(-4), { color: bottomRightColor, id }];
		});
	}, [bottomRightColor]);

	return (
		<View style={styles.container}>
			<View style={styles.overlay}>
				<Canvas style={{ width, height }}>
					{topLeftItems.map(({ id, color }, index, arr) => (
						<Glow
							key={id}
							top={true}
							color={color || ''}
							fadeout={index !== arr.length - 1}
							width={width}
							height={height}
						/>
					))}

					{bottomRightItems.map(({ id, color }, index, arr) => (
						<Glow
							key={id}
							color={color || ''}
							fadeout={index !== arr.length - 1}
							width={width}
							height={height}
						/>
					))}
				</Canvas>
			</View>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
});

export default memo(GlowingBackground);
