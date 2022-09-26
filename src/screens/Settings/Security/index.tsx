import React, { memo, ReactElement, useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ReactNativeBiometrics from 'react-native-biometrics';

import Store from '../../../store/types';
import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { removePin, toggleBiometrics } from '../../../utils/settings';
import { IsSensorAvailableResult } from '../../../components/Biometrics';
import { toggleView } from '../../../store/actions/user';
import { updateSettings } from '../../../store/actions/settings';

const rnBiometrics = new ReactNativeBiometrics();

const SecuritySettings = ({ navigation }): ReactElement => {
	const [biometryData, setBiometricData] = useState<
		IsSensorAvailableResult | undefined
	>(undefined);
	const { pin, biometrics, pinOnLaunch, pinForPayments } = useSelector(
		(state: Store) => state.settings,
	);

	useEffect(() => {
		(async (): Promise<void> => {
			const data: IsSensorAvailableResult =
				await rnBiometrics.isSensorAvailable();
			setBiometricData(data);
		})();
	}, []);

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Pin',
						value: pin ? 'Enabled' : 'Disabled',
						type: 'button',
						onPress: (): void => {
							if (pin) {
								navigation.navigate('AuthCheck', {
									onSuccess: () => {
										navigation.pop();
										removePin().then();
									},
								});
							} else {
								toggleView({
									view: 'PINPrompt',
									data: { isOpen: true, showLaterButton: false },
								});
							}
						},
						hide: false,
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
						title: 'Use Biometrics instead',
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
						hide:
							!pin || (!biometryData?.available && !biometryData?.biometryType),
					},
				],
			},
		],
		[
			biometryData?.available,
			biometryData?.biometryType,
			biometrics,
			pin,
			pinOnLaunch,
			pinForPayments,
			navigation,
		],
	);

	return (
		<>
			<SettingsView
				title={'Security And Privacy'}
				listData={SettingsListData}
				showBackNavigation={true}
			/>
		</>
	);
};

export default memo(SecuritySettings);
