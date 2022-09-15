import React, { ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { RNCamera } from 'react-native-camera';
import { systemWeights } from 'react-native-typography';

import { EvilIcon, Text, View } from '../styles/components';
import { showErrorNotification } from '../utils/notifications';

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
	const notAuthorizedView = (
		<View style={styles.notAuthorizedView}>
			<EvilIcon name={'exclamation'} size={60} />
			<Text style={styles.boldText}>
				It appears Bitkit does not have permission to access your camera.
			</Text>
			<Text style={styles.text}>
				To utilize this feature in the future you will need to enable camera
				permissions for this app from your phones settings.
			</Text>
		</View>
	);

	const onMountError = (): void => {
		console.error(
			'An error was encountered when loading the camera. Please ensure Bitkit has permission to use this feature in your phone settings.',
		);
		showErrorNotification(
			{
				title: 'Error',
				message: 'Error loading camera, please check permissions.',
			},
			'bottom',
		);
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
					notAuthorizedView={notAuthorizedView}
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
	notAuthorizedView: {
		flex: 1,
		top: -40,
		backgroundColor: 'transparent',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 20,
	},
	text: {
		...systemWeights.regular,
		fontSize: 18,
		textAlign: 'center',
	},
	boldText: {
		...systemWeights.bold,
		fontSize: 18,
		textAlign: 'center',
		marginVertical: 10,
	},
});

export default Camera;
