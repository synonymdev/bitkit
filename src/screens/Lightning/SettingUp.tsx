import React, { ReactElement, memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Display, Text01S } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import HourglassSpinner from '../../components/HourglassSpinner';
import ProgressSteps from '../../components/ProgressSteps';
import { lightningSettingUpStepSelector } from '../../store/reselect/user';
import type { LightningScreenProps } from '../../navigation/types';

const SettingUp = ({
	navigation,
}: LightningScreenProps<'SettingUp'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const lightningSettingUpStep = useSelector(lightningSettingUpStepSelector);

	const steps = [
		{ title: t('setting_up_step1') },
		{ title: t('setting_up_step2') },
		{ title: t('setting_up_step3') },
		{ title: t('setting_up_step4') },
	];

	useEffect(() => {
		let interval = setTimeout(() => {
			navigation.navigate('Timeout');
		}, 2 * 60 * 1000);

		if (lightningSettingUpStep === 3) {
			interval = setTimeout(() => navigation.navigate('Success'), 1000);
		}

		return () => {
			clearTimeout(interval);
		};
	}, [lightningSettingUpStep, navigation]);

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('add_instant_payments')}
				displayBackButton={false}
			/>
			<View style={styles.content} testID="LightningSettingUp">
				<Display color="purple">{t('setting_up_header')}</Display>
				<Text01S style={styles.text} color="gray1">
					{t('setting_up_text')}
				</Text01S>

				<HourglassSpinner glowColor="purple" />

				<ProgressSteps
					style={styles.progress}
					steps={steps}
					activeStepIndex={lightningSettingUpStep}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
		marginBottom: 16,
	},
	progress: {
		marginTop: 'auto',
		paddingVertical: 20,
	},
});

export default memo(SettingUp);
