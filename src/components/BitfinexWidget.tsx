import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
	Skia,
	Canvas,
	LinearGradient,
	vec,
	Path,
} from '@shopify/react-native-skia';

import { View, BitfinexIcon, Text01M, Caption13M } from '../styles/components';
import useColors from '../hooks/colors';

const Chart = (): ReactElement => {
	const { green, red } = useColors();
	const [layout, setLayout] = useState({ width: 1, height: 1 });

	const handleLayout = (event): void => {
		setLayout({
			width: event.nativeEvent.layout.width,
			height: event.nativeEvent.layout.height,
		});
	};

	let { height, width } = layout;
	const color = Math.random() > 0.5 ? green : red;

	const backgroud = Skia.Path.Make();
	const line = Skia.Path.Make();
	const steps = 20;
	const step = width / steps;

	backgroud.moveTo(0, 0);
	for (let i = 0; i <= steps; i++) {
		const rand = height - Math.random() * (height - 10);
		backgroud.lineTo(i * step, rand);
		if (i === 0) {
			line.moveTo(i * step, rand);
		} else {
			line.lineTo(i * step, rand);
		}
	}
	backgroud.lineTo(width, height);
	backgroud.lineTo(0, height);
	backgroud.close();

	return (
		<View style={styles.chart} onLayout={handleLayout}>
			<Canvas style={styles.canvas}>
				<Path path={backgroud} color={color}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, height * 1.3)}
						positions={[0, 1]}
						colors={[color, 'transparent']}
					/>
				</Path>
				<Path
					path={line}
					color={color}
					style="stroke"
					strokeJoin="round"
					strokeWidth={2}
				/>
			</Canvas>
		</View>
	);
};

const BitfinexWidget = (): ReactElement => {
	return (
		<View style={styles.root}>
			<View style={styles.icon}>
				<BitfinexIcon />
			</View>
			<View>
				<Text01M>Bitfinex</Text01M>
				<Caption13M color="gray1">Bitcoin Price (1d)</Caption13M>
			</View>
			<View style={styles.chart}>
				<Chart />
			</View>
			<View>
				<Text01M>$20,467</Text01M>
				<Caption13M color="green">+3.5%</Caption13M>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		height: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	icon: {
		marginRight: 16,
		borderRadius: 6.4,
		overflow: 'hidden',
	},
	chart: {
		flex: 1,
		height: 50,
		marginHorizontal: 16,
	},
	canvas: {
		flex: 1,
	},
});

export default memo(BitfinexWidget);
