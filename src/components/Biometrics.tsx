import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { StyleSheet } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

import {
	Subtitle,
	Ionicons,
	MaterialIcons,
	View,
	TouchableOpacity,
} from '../styles/components';
import { vibrate } from '../utils/helpers';
import { toggleBiometrics } from '../utils/settings';

const rnBiometrics = ReactNativeBiometrics;

const getIcon = ({
	biometryData = undefined,
}: {
	biometryData: IsSensorAvailableResult | undefined;
}): ReactElement => {
	try {
		if (!biometryData || !biometryData?.available) {
			return <View />;
		}
		const biometryType = biometryData?.biometryType;
		if (biometryType === 'FaceID') {
			return <MaterialIcons name={'face'} size={65} />;
		}
		if (biometryType === 'TouchID' || biometryType === 'Biometrics') {
			return <Ionicons name={'ios-finger-print'} size={65} />;
		}

		return <></>;
	} catch {
		return <></>;
	}
};

export type BiometryType = 'TouchID' | 'FaceID' | 'Biometrics';
export interface IsSensorAvailableResult {
	available: boolean;
	biometryType?: BiometryType;
	error?: string;
}

interface BiometricsComponent {
	onSuccess: Function;
	onFailure?: Function;
	style?: object;
	children?: ReactElement;
}
const Biometrics = ({
	onSuccess = (): null => null,
	onFailure = (): null => null,
	style = {},
	children = <></>,
}: BiometricsComponent): ReactElement => {
	const [biometryData, setBiometricData] = useState<
		IsSensorAvailableResult | undefined
	>(undefined);

	useEffect(() => {
		(async (): Promise<void> => {
			const data: IsSensorAvailableResult =
				await rnBiometrics.isSensorAvailable();
			setBiometricData(data);
			authenticate(`Confirm ${data?.biometryType || ''}`);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const Icon = useCallback(
		() => getIcon({ biometryData }),
		//eslint-disable-next-line react-hooks/exhaustive-deps
		[biometryData?.biometryType],
	);
	const text = useCallback((): string => {
		try {
			if (!biometryData?.available || !biometryData?.biometryType) {
				return 'Loading Biometrics...';
			}
			if (biometryData?.available && biometryData?.biometryType) {
				return `${biometryData.biometryType} Enabled`;
			}
			return 'It appears that your device does not support Biometric security.';
		} catch {
			return 'It appears that your device does not support Biometric security.';
		}
	}, [biometryData?.available, biometryData?.biometryType]);

	const authenticate = useCallback(
		(promptMessage: string | undefined = undefined): void => {
			try {
				if (!promptMessage) {
					const biotmetryType = biometryData?.biometryType;
					promptMessage = `Confirm ${biotmetryType}`;
				}
				rnBiometrics
					.simplePrompt({
						promptMessage: promptMessage || '',
					})
					.then(({ success }) => {
						if (success) {
							toggleBiometrics(true);
							onSuccess();
						} else {
							vibrate({});
							onFailure();
						}
					})
					.catch(() => {
						console.log('biometrics failed');
						onFailure();
					});
			} catch {}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[biometryData?.biometryType],
	);

	return (
		<View color="transparent" style={[styles.container, style]}>
			<TouchableOpacity
				color="transparent"
				activeOpacity={0.6}
				onPress={authenticate}
				style={styles.container}>
				<Icon />
				<Subtitle style={styles.text}>{text()}</Subtitle>
			</TouchableOpacity>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20,
	},
	text: {
		marginTop: 16,
		textAlign: 'center',
	},
});

export default memo(Biometrics);
