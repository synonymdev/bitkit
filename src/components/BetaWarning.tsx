import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { Caption13M, Text01M, XIcon, AnimatedView } from '../styles/components';
import useColors from '../hooks/colors';
import Store from '../store/types';
import { updateSettings } from '../store/actions/settings';
import Flag from '../components/Flag';

const BETA_HEIGHT = 100;

const BetaSoftware = (): ReactElement => {
	const colors = useColors();
	const [layout, setLayout] = useState({ width: 1, height: 1 });
	const hideBeta = useSelector((state: Store) => state.settings.hideBeta);

	if (hideBeta) {
		return <></>;
	}

	const handleLayout = (event): void => {
		setLayout({
			width: event.nativeEvent.layout.width,
			height: event.nativeEvent.layout.height,
		});
	};

	const handleHide = (): void => {
		updateSettings({ hideBeta: true });
	};

	const { height, width } = layout;

	return (
		<AnimatedView
			exiting={FadeOut}
			style={[styles.root, { borderColor: colors.brand }]}
			onLayout={handleLayout}>
			<Canvas style={styles.canvas}>
				<Rect x={0} y={0} width={width} height={height}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, height)}
						positions={[0, 1]}
						colors={['transparent', colors.brand16]}
					/>
				</Rect>
			</Canvas>
			<Flag text="BETA" style={styles.flag} />
			<Text01M>Bitkit is beta software.</Text01M>
			<Caption13M color="brand">
				Don’t store all your money in Bitkit.
			</Caption13M>
			{/* TODO: allow hide it later */}
			{false && (
				<TouchableOpacity onPress={handleHide} style={styles.button}>
					<XIcon color="brand" width={17} height={17} />
				</TouchableOpacity>
			)}
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	root: {
		height: BETA_HEIGHT,
		borderWidth: 1,
		borderStyle: 'dashed',
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	canvas: {
		...StyleSheet.absoluteFillObject,
	},
	flag: {
		position: 'absolute',
		top: -1,
		right: -1,
	},
	button: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: 50,
		width: 50,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(BetaSoftware);
