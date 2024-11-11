import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ActivityIndicator } from './components/ActivityIndicator';

const WalletLoading = (): ReactElement => (
	<Animated.View
		style={styles.root}
		entering={FadeIn.duration(1000)}
		exiting={FadeOut.duration(1000)}>
		<ActivityIndicator />
	</Animated.View>
);

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default WalletLoading;
