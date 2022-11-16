import React, { memo, ReactElement, useMemo, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import rnBiometrics from 'react-native-biometrics';

import { View as ThemedView } from '../../../styles/components';
import Store from '../../../store/types';
import { IListData } from '../../../components/List';
import { toggleBiometrics } from '../../../utils/settings';
import { IsSensorAvailableResult } from '../../../components/Biometrics';
import { toggleView } from '../../../store/actions/user';
import { updateSettings } from '../../../store/actions/settings';
import SettingsView from '../SettingsView';
import type { SettingsScreenProps } from '../../../navigation/types';

const SecuritySettings = ({
	navigation,
}: SettingsScreenProps<'SecuritySettings'>): ReactElement => {
	const [biometryData, setBiometricData] = useState<IsSensorAvailableResult>();
	const {
		enableAutoReadClipboard,
		enableSendAmountWarning,
		pin,
		biometrics,
		pinOnLaunch,
		pinForPayments,
	} = useSelector((state: Store) => state.settings);

	useEffect(() => {
		(async (): Promise<void> => {
			const data: IsSensorAvailableResult =
				await rnBiometrics.isSensorAvailable();
			setBiometricData(data);
		})();
	}, []);

	const isBiometrySupported =
		biometryData?.available && biometryData?.biometryType;
	const biometryTypeName =
		biometryData?.biometryType === 'TouchID'
			? 'Touch ID'
			: biometryData?.biometryType === 'FaceID'
			? 'Face ID'
			: biometryData?.biometryType ?? 'Biometrics';

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Read clipboard for ease of use',
						type: 'switch',
						enabled: enableAutoReadClipboard,
						onPress: (): void => {
							updateSettings({
								enableAutoReadClipboard: !enableAutoReadClipboard,
							});
						},
					},
					{
						title: 'Warning for sending over $100',
						type: 'switch',
						enabled: enableSendAmountWarning,
						onPress: (): void => {
							updateSettings({
								enableSendAmountWarning: !enableSendAmountWarning,
							});
						},
					},
					{
						title: 'PIN Code',
						value: pin ? 'Enabled' : 'Disabled',
						type: 'button',
						onPress: (): void => {
							if (pin) {
								navigation.navigate('DisablePin');
							} else {
								toggleView({
									view: 'PINPrompt',
									data: { isOpen: true, showLaterButton: false },
								});
							}
						},
					},
					{
						title: 'Change PIN Code',
						type: 'button',
						onPress: (): void => {
							navigation.navigate('ChangePin');
						},
						hide: !pin,
					},
					{
						title: 'Require PIN on launch',
						type: 'switch',
						enabled: pinOnLaunch,
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									updateSettings({ pinOnLaunch: !pinOnLaunch });
								},
							});
						},
						hide: !pin,
					},
					{
						title: 'Require PIN for payments',
						type: 'switch',
						enabled: pinForPayments,
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									updateSettings({ pinForPayments: !pinForPayments });
								},
							});
						},
						hide: !pin,
					},
					{
						title: `Use ${biometryTypeName} instead`,
						type: 'switch',
						enabled: biometrics,
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									toggleBiometrics();
								},
							});
						},
						hide: !pin || !isBiometrySupported,
					},
				],
			},
		],
		[
			enableAutoReadClipboard,
			enableSendAmountWarning,
			isBiometrySupported,
			biometryTypeName,
			biometrics,
			pin,
			pinOnLaunch,
			pinForPayments,
			navigation,
		],
	);

	const footerText =
		pin && isBiometrySupported
			? 'When enabled, you can use Biometrics instead of your PIN code to unlock your wallet or send payments.'
			: undefined;

	return (
		<ThemedView style={styles.container}>
			<SettingsView
				title="Security And Privacy"
				listData={SettingsListData}
				showBackNavigation={true}
				fullHeight={false}
				footerText={footerText}
			/>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default memo(SecuritySettings);
