import React, { ReactElement, useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Keyframe, FadeOut } from 'react-native-reanimated';
import { AnimatedView } from '../../styles/components';
import { Display } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';

const imageSrc = require('../../assets/illustrations/rocket.png');

const DURATION = 40000;

const enteringAnimation = new Keyframe({
	0: { originX: -1000, originY: 1000 }, // bottom-left
	5: { originX: 1000, originY: -1000 }, // top-right
	10: { originX: -1000, originY: -1000 }, // top-left

	15: { originX: -1000, originY: 1000 }, // bottom-left
	20: { originX: 1000, originY: -1000 }, // top-right
	25: { originX: -1000, originY: -1000 }, // top-left

	30: { originX: -1000, originY: 1000 }, // bottom-left
	35: { originX: 1000, originY: -1000 }, // top-right
	40: { originX: -1000, originY: -1000 }, // top-left

	45: { originX: -1000, originY: 1000 }, // bottom-left
	50: { originX: 1000, originY: -1000 }, // top-right
	55: { originX: -1000, originY: -1000 }, // top-left

	60: { originX: -1000, originY: 1000 }, // bottom-left
	65: { originX: 1000, originY: -1000 }, // top-right
	70: { originX: -1000, originY: -1000 }, // top-left

	75: { originX: -1000, originY: 1000 }, // bottom-left
	80: { originX: 1000, originY: -1000 }, // top-right
	85: { originX: -1000, originY: -1000 }, // top-left

	90: { originX: -1000, originY: 1000 }, // bottom-left
	95: { originX: 1000, originY: -1000 }, // top-right
	100: { originX: -1000, originY: -1000 }, // top-left
}).duration(DURATION);

const LoadingWalletScreen = (): ReactElement => {
	const [key, setKey] = useState(false);

	useEffect(() => {
		// repeat entering animation every DURATION seconds
		const interval = setInterval(() => setKey((v) => !v), DURATION);
		return () => clearInterval(interval);
	}, []);

	return (
		<View style={styles.container}>
			<SafeAreaInsets type="top" />
			<View style={styles.loadingText}>
				<Display>Setting up</Display>
				<Display color="brand">your Wallet.</Display>
			</View>
			<View style={styles.animationContainer}>
				<AnimatedView
					key={key}
					entering={enteringAnimation}
					exiting={FadeOut}
					color="transparent">
					<Image source={imageSrc} />
				</AnimatedView>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 48,
	},
	loadingText: {
		flex: 1,
		justifyContent: 'center',
	},
	animationContainer: {
		marginTop: 30,
		flex: 2,
		alignItems: 'center',
		alignSelf: 'center',
	},
});

export default LoadingWalletScreen;
