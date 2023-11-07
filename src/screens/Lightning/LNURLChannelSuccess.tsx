import React, { ReactElement, memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { LightningScreenProps } from '../../navigation/types';
import InfoScreen from '../../components/InfoScreen';

const imageSrc = require('../../assets/illustrations/switch.png');

const LNURLChannelSuccess = ({
	navigation,
}: LightningScreenProps<'LNURLChannelSuccess'>): ReactElement => {
	const { t } = useTranslation('other');

	const handleAwesome = (): void => {
		navigation.popToTop();
		navigation.goBack();
	};

	return (
		<InfoScreen
			accentColor="purple"
			navTitle={t('lnurl_channel_header')}
			displayBackButton={false}
			title={t('lnurl_channel_connecting')}
			description={t('lnurl_channel_connecting_text')}
			image={imageSrc}
			buttonText={t('lightning:awesome')}
			testID="LNURLChannelSuccess"
			onButtonPress={handleAwesome}
		/>
	);
};

export default memo(LNURLChannelSuccess);
