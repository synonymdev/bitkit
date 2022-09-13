import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAppSelector } from '../hooks/redux';
import {
	View,
	AnimatedView,
	Text01M,
	Caption13M,
	BrokenLinkIcon,
} from '../styles/components';

const ConnectivityIndicator = (): ReactElement => {
	const { isOnline, isConnectedToElectrum } = useAppSelector(
		(state) => state.user,
	);

	if (isOnline && isConnectedToElectrum) {
		return <></>;
	}

	return (
		<AnimatedView
			style={styles.container}
			color="transparent"
			entering={FadeIn}
			exiting={FadeOut}>
			<BrokenLinkIcon />
			<View color="transparent" style={styles.textContainer}>
				<Text01M>Connectivity Issues</Text01M>
				<Caption13M color="gray1">It appears you’re disconnected</Caption13M>
			</View>
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	container: {
		minHeight: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginTop: 20,
	},
	textContainer: {
		marginHorizontal: 12,
	},
});

export default memo(ConnectivityIndicator);
