import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BiometryType } from 'react-native-biometrics';
import { useTranslation } from 'react-i18next';

import { View, TouchableOpacity } from '../styles/components';
import { Subtitle } from '../styles/text';
import { FingerPrintIcon } from '../styles/icons';
import { useAppDispatch } from '../hooks/redux';
import { updateSettings } from '../store/slices/settings';
import { vibrate } from '../utils/helpers';
import rnBiometrics from '../utils/biometrics';

export interface IsSensorAvailableResult {
	available: boolean;
	biometryType?: BiometryType;
	error?: string;
}

const getIcon = (biometryData?: IsSensorAvailableResult): ReactElement => {
	if (!biometryData?.available) {
		return <View />;
	}
	const biometryType = biometryData.biometryType;
	if (biometryType === 'TouchID' || biometryType === 'Biometrics') {
		return <FingerPrintIcon />;
	}
	return <></>;
};

const Biometrics = ({
	onSuccess,
	onFailure,
	style,
	children,
}: {
	onSuccess?: () => void;
	onFailure?: () => void;
	style?: StyleProp<ViewStyle>;
	children?: ReactElement;
}): ReactElement => {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation('security');
	const dispatch = useAppDispatch();
	const [biometryData, setBiometricData] = useState<IsSensorAvailableResult>();

	useEffect(() => {
		(async (): Promise<void> => {
			const data = await rnBiometrics.isSensorAvailable();
			setBiometricData(data);
			authenticate(
				t('bio_confirm', { biometricsName: data.biometryType || t('bio') }),
			);
		})();
	}, [t]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const Icon = useCallback(
		() => getIcon(biometryData),
		[biometryData?.biometryType],
	);

	const getText = useCallback((): string => {
		try {
			if (!biometryData?.available || !biometryData?.biometryType) {
				return '';
			}
			if (biometryData?.biometryType === 'FaceID') {
				return '';
			}
			if (biometryData?.available && biometryData?.biometryType) {
				return t('bio_auth_with', {
					biometricsName: biometryData.biometryType,
				});
			}
			return t('bio_no');
		} catch {
			return t('bio_no');
		}
	}, [biometryData?.available, biometryData?.biometryType, t]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const authenticate = useCallback(
		(promptMessage?: string): void => {
			if (!promptMessage) {
				const biotmetryType = biometryData?.biometryType;
				promptMessage = t('bio_confirm', { biometricsName: biotmetryType });
			}
			rnBiometrics
				.simplePrompt({
					promptMessage,
					cancelButtonText: t('use_pin'),
				})
				.then(({ success }) => {
					if (success) {
						dispatch(updateSettings({ biometrics: true }));
						onSuccess?.();
					} else {
						vibrate();
						onFailure?.();
					}
				})
				.catch(() => {
					console.log('biometrics failed');
					onFailure?.();
				});
		},
		[biometryData?.biometryType, t],
	);

	return (
		<View color="transparent" style={[styles.container, style]}>
			<TouchableOpacity
				style={[styles.container, { paddingBottom: insets.bottom + 120 }]}
				color="transparent"
				activeOpacity={0.7}
				onPress={(): void => authenticate()}
				testID="Biometrics">
				<Icon />
				<Subtitle style={styles.text}>{getText()}</Subtitle>
			</TouchableOpacity>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
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
