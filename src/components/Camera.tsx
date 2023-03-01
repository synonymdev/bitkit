import React, { ReactElement, useState, useEffect } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Camera as CameraKit, CameraType } from 'react-native-camera-kit';
import { useTranslation } from 'react-i18next';

import CameraNoAuth from './CameraNoAuth';
import GradientView from './GradientView';

enum Status {
	AUTHORIZED = 'AUTHORIZED',
	NOT_AUTHORIZED = 'NOT_AUTHORIZED',
	UNKNOWN = 'UNKNOWN',
}

const Camera = ({
	onBarCodeRead,
	children,
	torchMode = false,
}: {
	onBarCodeRead: (data: string) => void;
	children?: ReactElement;
	torchMode?: boolean;
}): ReactElement => {
	const { t } = useTranslation('other');
	const isFocused = useIsFocused();
	const [_data, setData] = useState('');
	const [cameraStatus, setCameraStatus] = useState<Status>(Status.UNKNOWN);

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
					setCameraStatus(Status.NOT_AUTHORIZED);
					break;
				case RESULTS.DENIED:
					const rationale = {
						title: t('camera_ask_title'),
						message: t('camera_ask_msg'),
						buttonPositive: t('ok'),
						buttonNegative: t('cancel'),
					};
					const requestResponse = await request(cameraPermission, rationale);
					setCameraStatus(
						requestResponse === RESULTS.GRANTED
							? Status.AUTHORIZED
							: Status.NOT_AUTHORIZED,
					);
					break;
				case RESULTS.LIMITED:
				case RESULTS.GRANTED:
					setCameraStatus(Status.AUTHORIZED);
					break;
			}
		})();
	}, [t]);

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
			{cameraStatus === Status.AUTHORIZED && (
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
			{cameraStatus === Status.NOT_AUTHORIZED && <CameraNoAuth />}
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
