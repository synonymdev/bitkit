import React, { ReactElement, memo } from 'react';
import { useTranslation } from 'react-i18next';
import InfoScreen from '../../components/InfoScreen';
import type { LightningScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/switch.png');

const Success = ({
	navigation,
}: LightningScreenProps<'Success'>): ReactElement => {
	const { t } = useTranslation('lightning');

	const onContinue = (): void => {
		navigation.popToTop();
		navigation.goBack();
	};

	return (
		<InfoScreen
			accentColor="purple"
			navTitle={t('add_instant_payments')}
			displayBackButton={false}
			title={t('result_header')}
			description={t('result_text')}
			image={imageSrc}
			buttonText={t('awesome')}
			testID="LightningSuccess"
			onButtonPress={onContinue}
		/>
	);
};

export default memo(Success);
