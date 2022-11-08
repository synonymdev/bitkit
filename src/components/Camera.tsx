import React, { ReactElement, useState, useEffect } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Camera as CameraKit, CameraType } from 'react-native-camera-kit';

import CameraNoAuth from './CameraNoAuth';
import GradientView from './GradientView';

const STATUS = Object.freeze({
	AUTHORIZED: 'AUTHORIZED',
	NOT_AUTHORIZED: 'NOT_AUTHORIZED',
	UNKNOWN: 'UNKNOWN',
});

const Camera = ({
	onBarCodeRead,
	children,
	torchMode = false,
}: {
	onBarCodeRead: Function;
	children?: ReactElement;
	torchMode?: boolean;
}): ReactElement => {
	const isFocused = useIsFocused();
	const [_data, setData] = useState('');
	const [cameraStatus, setCameraStatus] = useState(STATUS.UNKNOWN);

	useEffect(() => {
		(async (): Promise<void> => {
			const cameraPermission =
				Platform.OS === 'ios'
					? PERMISSIONS.IOS.CAMERA
					: PERMISSIONS.ANDROID.CAMERA;
			const checkResponse = await check(cameraPermission);
			switch (checkResponse) {
				case RESULTS.UNAVAILABLE:
				case RESULTS.BLOCKED:
					setCameraStatus(STATUS.NOT_AUTHORIZED);
					break;
				case RESULTS.DENIED:
					const rationale = {
						title: 'Permission to use camera',
						message: 'Bitkit needs permission to use your camera',
						buttonPositive: 'Okay',
						buttonNegative: 'Cancel',
					};
					const requestResponse = await request(cameraPermission, rationale);
					setCameraStatus(
						requestResponse === RESULTS.GRANTED
							? STATUS.AUTHORIZED
							: STATUS.NOT_AUTHORIZED,
					);
					break;
				case RESULTS.LIMITED:
				case RESULTS.GRANTED:
					setCameraStatus(STATUS.AUTHORIZED);
					break;
			}
		})();
	}, []);

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

	console.info('cameraStatus', cameraStatus);

	return (
		<GradientView style={styles.container}>
			{cameraStatus === STATUS.AUTHORIZED && (
				<>
					<CameraKit
						style={styles.camera}
						scanBarcode={true}
						onReadCode={handleCodeRead}
						torchMode={torchMode ? 'on' : 'off'}
						cameraType={CameraType.Back}
					/>
					{children}
				</>
			)}
			{cameraStatus === STATUS.NOT_AUTHORIZED && <CameraNoAuth />}
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
