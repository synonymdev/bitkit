import React, { ReactElement, memo } from 'react';
import { useTranslation } from 'react-i18next';
import InfoScreen from '../../components/InfoScreen';
import type { LightningScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const Timeout = ({
	navigation,
}: LightningScreenProps<'Timeout'>): ReactElement => {
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
			title={t('timeout_header')}
			description={t('timeout_text')}
			image={imageSrc}
			buttonText={t('close')}
			testID="LightningTimeout"
			onButtonPress={onContinue}
		/>
	);
};

export default memo(Timeout);
