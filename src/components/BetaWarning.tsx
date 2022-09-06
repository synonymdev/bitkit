import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
	Caption13M,
	Caption13Up,
	Text01M,
	View,
	XIcon,
	AnimatedView,
} from '../styles/components';
import useColors from '../hooks/colors';
import Store from '../store/types';
import { updateSettings } from '../store/actions/settings';

const FLAG_HEIGHT = 26;
const BETA_HEIGHT = 100;

const Flag = ({
	style,
	text,
}: {
	style?: object;
	text: string;
}): ReactElement => {
	return (
		<View style={[stylesFlag.root, style]} color="transparent">
			<View color="brand" style={[stylesFlag.box, stylesFlag.box3]} />
			<View style={stylesFlag.row} color="transparent">
				<View color="brand" style={[stylesFlag.box, stylesFlag.box1]} />
				<View color="brand" style={[stylesFlag.box, stylesFlag.box2]} />
				<View color="brand" style={stylesFlag.text}>
					<Caption13Up>{text}</Caption13Up>
				</View>
			</View>
		</View>
	);
};

const stylesFlag = StyleSheet.create({
	root: {
		height: FLAG_HEIGHT * 1.5,
		overflow: 'hidden',
	},
	row: {
		height: FLAG_HEIGHT,
		overflow: 'hidden',
		paddingLeft: FLAG_HEIGHT / 2,
		position: 'relative',
	},
	box: {
		height: FLAG_HEIGHT,
		width: FLAG_HEIGHT,
		position: 'absolute',
	},
	box1: {
		transform: [{ skewY: '45deg' }],
		top: -FLAG_HEIGHT / 2,
	},
	box2: {
		transform: [{ skewY: '-45deg' }],
		top: +FLAG_HEIGHT / 2,
	},
	box3: {
		transform: [{ skewY: '45deg' }],
		right: -FLAG_HEIGHT / 2,
		top: FLAG_HEIGHT / 2,
		opacity: 0.5,
	},
	text: {
		height: FLAG_HEIGHT,
		paddingLeft: 6,
		paddingRight: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

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
			<TouchableOpacity onPress={handleHide} style={styles.button}>
				<XIcon color="brand" width={17} height={17} />
			</TouchableOpacity>
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
