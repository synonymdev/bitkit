import React, { memo, ReactElement, useMemo, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import Store from '../../../store/types';
import { EItemType, IListData } from '../../../components/List';
import { IsSensorAvailableResult } from '../../../components/Biometrics';
import { showBottomSheet } from '../../../store/actions/ui';
import { updateSettings } from '../../../store/actions/settings';
import SettingsView from '../SettingsView';
import rnBiometrics from '../../../utils/biometrics';
import type { SettingsScreenProps } from '../../../navigation/types';

const SecuritySettings = ({
	navigation,
}: SettingsScreenProps<'SecuritySettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const [biometryData, setBiometricData] = useState<IsSensorAvailableResult>();
	const {
		enableAutoReadClipboard,
		enableSendAmountWarning,
		pin,
		biometrics,
		pinOnLaunch,
		pinOnIdle,
		pinForPayments,
	} = useSelector((state: Store) => state.settings);

	useEffect(() => {
		(async (): Promise<void> => {
			const data = await rnBiometrics.isSensorAvailable();
			setBiometricData(data);
		})();
	}, []);

	const isBiometrySupported =
		biometryData?.available && biometryData.biometryType;

	const biometryTypeName =
		biometryData?.biometryType === 'TouchID'
			? t('security:bio_touch_id')
			: biometryData?.biometryType === 'FaceID'
			? t('security:bio_face_id')
			: biometryData?.biometryType ?? t('security:bio');

	const footerText =
		pin && isBiometrySupported
			? t('security.footer', { biometryTypeName })
			: undefined;

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: t('security.clipboard'),
						type: EItemType.switch,
						enabled: enableAutoReadClipboard,
						onPress: (): void => {
							updateSettings({
								enableAutoReadClipboard: !enableAutoReadClipboard,
							});
						},
					},
					{
						title: t('security.warn_100'),
						type: EItemType.switch,
						enabled: enableSendAmountWarning,
						onPress: (): void => {
							updateSettings({
								enableSendAmountWarning: !enableSendAmountWarning,
							});
						},
					},
					{
						title: t('security.pin'),
						value: t(pin ? 'security.pin_enabled' : 'security.pin_disabled'),
						type: EItemType.button,
						testID: 'PINCode',
						onPress: (): void => {
							if (pin) {
								navigation.navigate('DisablePin');
							} else {
								showBottomSheet('PINNavigation', { showLaterButton: false });
							}
						},
					},
					{
						title: t('security.pin_change'),
						type: EItemType.button,
						hide: !pin,
						testID: 'ChangePIN',
						onPress: (): void => {
							navigation.navigate('ChangePin');
						},
					},
					{
						title: t('security.pin_launch'),
						type: EItemType.switch,
						enabled: pinOnLaunch,
						hide: !pin,
						testID: 'EnablePinOnLaunch',
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									updateSettings({ pinOnLaunch: !pinOnLaunch });
								},
							});
						},
					},
					{
						title: t('security.pin_idle'),
						type: EItemType.switch,
						enabled: pinOnIdle,
						hide: !pin,
						testID: 'EnablePinOnIdle',
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									updateSettings({ pinOnIdle: !pinOnIdle });
								},
							});
						},
					},
					{
						title: t('security.pin_payments'),
						type: EItemType.switch,
						enabled: pinForPayments,
						hide: !pin,
						testID: 'EnablePinForPayments',
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									updateSettings({ pinForPayments: !pinForPayments });
								},
							});
						},
					},
					{
						title: t('security.use_bio', { biometryTypeName }),
						type: EItemType.switch,
						enabled: biometrics,
						hide: !pin || !isBiometrySupported,
						testID: 'UseBiometryInstead',
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									updateSettings({ biometrics: !biometrics });
								},
							});
						},
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
			pinOnIdle,
			pinForPayments,
			navigation,
			t,
		],
	);

	return (
		<ThemedView style={styles.container}>
			<SettingsView
				title={t('security_title')}
				listData={settingsListData}
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
