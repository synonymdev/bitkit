import React, { ReactElement, useState, useEffect, useRef } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
	Camera as CameraKit,
	CameraApi,
	CameraType,
} from 'react-native-camera-kit';

import { showErrorNotification } from '../utils/notifications';
import CameraNoAuth from './CameraNoAuth';
import GradientView from './GradientView';

const STATUS = Object.freeze({
	AUTHORIZED: 'AUTHORIZED',
	NOT_AUTHORIZED: 'NOT_AUTHORIZED',
	UNKNOWN: 'UNKNOWN',
});

const Camera = ({
	onBarCodeRead = (): null => null,
	onClose = (): null => null,
	children = undefined,
	torchMode = false,
}: {
	onBarCodeRead: Function;
	onClose: Function;
	children?: ReactElement;
	torchMode?: boolean;
}): ReactElement => {
	const isFocused = useIsFocused();
	const ref = useRef<CameraApi | null>(null);
	const [_data, setData] = useState('');
	const [cameraStatus, setCameraStatus] = useState(STATUS.UNKNOWN);

	useEffect(() => {
		if (Platform.OS !== 'ios') {
			return;
		}
		(async (): Promise<void> => {
			try {
				const camera = ref.current;
				if (!camera) {
					return;
				}

				let isUserAuthorizedCamera;
				const isCameraAuthorized =
					await camera.checkDeviceCameraAuthorizationStatus();

				switch (isCameraAuthorized) {
					case true:
						setCameraStatus(STATUS.AUTHORIZED);
						break;
					case false:
						setCameraStatus(STATUS.NOT_AUTHORIZED);
						isUserAuthorizedCamera =
							await camera.requestDeviceCameraAuthorization();
						if (isUserAuthorizedCamera) {
							setCameraStatus(STATUS.AUTHORIZED);
						}
						break;
					// @ts-ignore error in react-native-camera-kit
					// camera.checkDeviceCameraAuthorizationStatus() can return -1
					case -1:
						setCameraStatus(STATUS.UNKNOWN);
						isUserAuthorizedCamera =
							await camera.requestDeviceCameraAuthorization();
						if (isUserAuthorizedCamera) {
							setCameraStatus(STATUS.AUTHORIZED);
						}
						break;
				}
			} catch (e) {
				console.error('Camera error', e);
				showErrorNotification({
					title: 'Error',
					message: 'Error loading camera, please check permissions.',
				});
				onClose();
			}
		})();
	}, [onClose]);

	const handleCodeRead = (event): void => {
		const { codeStringValue } = event.nativeEvent;
		if (_data !== codeStringValue) {
			setData(codeStringValue);
			onBarCodeRead(codeStringValue);
		}
	};

	if (!isFocused) {
		return <View style={styles.container} />;
	}

	return (
		<GradientView style={styles.container}>
			{cameraStatus !== STATUS.NOT_AUTHORIZED && (
				<CameraKit
					ref={ref}
					style={styles.camera}
					scanBarcode={true}
					onReadCode={handleCodeRead}
					torchMode={torchMode ? 'on' : 'off'}
					cameraType={CameraType.Back}
				/>
			)}
			{cameraStatus === STATUS.NOT_AUTHORIZED ? <CameraNoAuth /> : children}
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	camera: {
		...StyleSheet.absoluteFillObject,
	},
});

export default Camera;
