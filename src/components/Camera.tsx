import React, {
	ReactElement,
	useState,
	useEffect,
	useRef,
	useCallback,
} from 'react';
import { StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
	Camera as VisionCamera,
	Point,
	useCameraDevice,
	useCodeScanner,
	useCameraPermission,
} from 'react-native-vision-camera';

import CameraNoAuth from './CameraNoAuth';
import GradientView from './GradientView';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

enum EAuthStatus {
	AUTHORIZED = 'AUTHORIZED',
	NOT_AUTHORIZED = 'NOT_AUTHORIZED',
	UNKNOWN = 'UNKNOWN',
}

const Camera = ({
	children,
	torchMode = false,
	bottomSheet = false,
	onBarCodeRead,
}: {
	children?: ReactElement;
	torchMode?: boolean;
	bottomSheet?: boolean;
	onBarCodeRead: (data: string) => void;
}): ReactElement => {
	const camera = useRef<VisionCamera>(null);
	const scannedCode = useRef('');
	const isFocused = useIsFocused();
	const [authStatus, setAuthStatus] = useState(EAuthStatus.UNKNOWN);

	const device = useCameraDevice('back');
	const { hasPermission, requestPermission } = useCameraPermission();

	useEffect(() => {
		const checkPermission = async (): Promise<void> => {
			if (hasPermission) {
				setAuthStatus(EAuthStatus.AUTHORIZED);
			} else {
				const granted = await requestPermission();
				if (granted) {
					setAuthStatus(EAuthStatus.AUTHORIZED);
				} else {
					setAuthStatus(EAuthStatus.NOT_AUTHORIZED);
				}
			}
		};

		checkPermission();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const codeScanner = useCodeScanner({
		codeTypes: ['qr'],
		onCodeScanned: (codes) => {
			const code = codes.find((c) => c.value);
			if (code?.value && scannedCode.current !== code.value) {
				scannedCode.current = code.value;
				onBarCodeRead(code.value);
			}
		},
	});

	const focus = useCallback((point: Point) => {
		camera.current?.focus(point);
	}, []);

	const gesture = Gesture.Tap().onEnd(({ x, y }) => {
		runOnJS(focus)({ x, y });
	});

	return (
		<GradientView style={styles.container}>
			{authStatus === EAuthStatus.AUTHORIZED && (
				<>
					{device && (
						<GestureDetector gesture={gesture}>
							<VisionCamera
								style={styles.camera}
								device={device}
								codeScanner={codeScanner}
								torch={torchMode ? 'on' : 'off'}
								enableZoomGesture={true}
								isActive={isFocused}
								onError={(error): void => console.error(error)}
							/>
						</GestureDetector>
					)}
					{children}
				</>
			)}
			{authStatus === EAuthStatus.NOT_AUTHORIZED && (
				<CameraNoAuth bottomSheet={bottomSheet} />
			)}
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
