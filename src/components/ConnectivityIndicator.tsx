import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAppSelector } from '../hooks/redux';
import { updateUser } from '../store/actions/user';
import {
	View,
	AnimatedView,
	Text01M,
	Caption13M,
	BrokenLinkIcon,
} from '../styles/components';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../utils/notifications';
import { connectToElectrum } from '../utils/wallet/electrum';
import Button from './Button';

const ConnectivityIndicator = (): ReactElement => {
	const [isLoading, setIsLoading] = useState(false);
	const { isOnline, isConnectedToElectrum } = useAppSelector(
		(state) => state.ui,
	);

	if (isOnline && isConnectedToElectrum) {
		return <></>;
	}

	const onRetry = async (): Promise<void> => {
		setIsLoading(true);
		const connectionResponse = await connectToElectrum({});
		if (connectionResponse.isOk()) {
			updateUser({ isConnectedToElectrum: true });
			showSuccessNotification({
				title: 'Bitkit Connection Restored',
				message: 'Successfully reconnected to Electrum Server.',
			});
		} else {
			updateUser({ isConnectedToElectrum: false });
			showErrorNotification({
				title: 'Bitkit Connection Lost',
				message: 'Please check your settings.',
			});
		}
		setIsLoading(false);
	};

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

			{!isConnectedToElectrum && (
				<Button
					style={styles.button}
					text="Retry"
					loading={isLoading}
					onPress={onRetry}
				/>
			)}
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
	button: {
		paddingHorizontal: 0,
		minWidth: 80,
		marginLeft: 'auto',
	},
});

export default memo(ConnectivityIndicator);
