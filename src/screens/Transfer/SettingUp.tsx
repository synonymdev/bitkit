import React, { ReactElement, memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display, BodyMB, BodyM } from '../../styles/text';
import { View as ThemedView } from '../../styles/components';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import HourglassSpinner from '../../components/HourglassSpinner';
import ProgressSteps from '../../components/ProgressSteps';
import Button from '../../components/buttons/Button';
import { useAppSelector } from '../../hooks/redux';
import { lightningSettingUpStepSelector } from '../../store/reselect/user';
import type { TransferScreenProps } from '../../navigation/types';

const SettingUp = ({
	navigation,
}: TransferScreenProps<'SettingUp'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const lightningSettingUpStep = useAppSelector(lightningSettingUpStepSelector);

	const steps = [
		{ title: t('setting_up_step1') },
		{ title: t('setting_up_step2') },
		{ title: t('setting_up_step3') },
		{ title: t('setting_up_step4') },
	];

	useEffect(() => {
		if (lightningSettingUpStep === 3) {
			setTimeout(() => {
				navigation.navigate('Success', { type: 'spending' });
			}, 1000);
		}
	}, [lightningSettingUpStep, navigation]);

	const onClose = (): void => {
		navigation.navigate('Wallet');
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				displayBackButton={false}
				onClosePress={onClose}
			/>
			<View style={styles.content} testID="LightningSettingUp">
				<Display color="purple">{t('setting_up_header')}</Display>
				<BodyM style={styles.text} color="secondary">
					<Trans
						t={t}
						i18nKey="setting_up_text"
						components={{ accent: <BodyMB color="white" /> }}
					/>
				</BodyM>

				<HourglassSpinner />

				<ProgressSteps
					style={styles.progress}
					steps={steps}
					activeStepIndex={lightningSettingUpStep}
				/>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('setting_up_button')}
						size="large"
						onPress={onClose}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
		marginBottom: 16,
	},
	progress: {
		marginTop: 'auto',
		paddingVertical: 20,
		marginBottom: 32,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default memo(SettingUp);
