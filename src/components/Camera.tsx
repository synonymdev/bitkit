import React, { ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { RNCamera } from 'react-native-camera';

import { View } from '../styles/components';
import { showErrorNotification } from '../utils/notifications';
import CameraNoAuth from './CameraNoAuth';

const Camera = ({
	onBarCodeRead = (): null => null,
	onClose = (): null => null,
	children = undefined,
	flashMode = false,
}: {
	onBarCodeRead: Function;
	onClose: Function;
	children?: ReactElement;
	flashMode?: boolean;
}): ReactElement => {
	const isFocused = useIsFocused();
	const [_data, setData] = useState('');

	const onMountError = (): void => {
		console.error(
			'An error was encountered when loading the camera. Please ensure Bitkit has permission to use this feature in your phone settings.',
		);
		showErrorNotification({
			title: 'Error',
			message: 'Error loading camera, please check permissions.',
		});
		onClose();
	};

	return (
		<View style={styles.container}>
			{isFocused && (
				<RNCamera
					captureAudio={false}
					style={styles.container}
					onBarCodeRead={({ data }): void => {
						if (_data !== data) {
							setData(data);
							onBarCodeRead(data);
						}
					}}
					onMountError={onMountError}
					notAuthorizedView={<CameraNoAuth />}
					type={RNCamera.Constants.Type.back}
					flashMode={
						flashMode
							? RNCamera.Constants.FlashMode.torch
							: RNCamera.Constants.FlashMode.off
					}
					androidCameraPermissionOptions={{
						title: 'Permission to use camera',
						message: 'Bitkit needs permission to use your camera',
						buttonPositive: 'Okay',
						buttonNegative: 'Cancel',
					}}>
					<View color={'transparent'} style={styles.content}>
						{children ?? <></>}
					</View>
				</RNCamera>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'transparent',
		position: 'absolute',
		height: '100%',
		width: '100%',
		zIndex: 1000,
	},
	content: {
		flex: 1,
	},
});

export default Camera;
