import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { BodyMB, Display } from '../../styles/text';
import InfoScreen from '../../components/InfoScreen';
import { getRandomOkText } from '../../utils/i18n/helpers';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/switch.png');

const LNURLChannelSuccess = ({
	navigation,
}: TransferScreenProps<'LNURLChannelSuccess'>): ReactElement => {
	const { t } = useTranslation('other');

	const handleAwesome = (): void => {
		navigation.popToTop();
		navigation.goBack();
	};

	return (
		<InfoScreen
			navTitle={t('lnurl_channel_header')}
			displayBackButton={false}
			title={
				<Trans
					t={t}
					i18nKey="lnurl_channel_connecting"
					components={{ accent: <Display color="purple" /> }}
				/>
			}
			description={
				<Trans
					t={t}
					i18nKey="lnurl_channel_connecting_text"
					components={{ accent: <BodyMB color="white" /> }}
				/>
			}
			image={imageSrc}
			buttonText={getRandomOkText()}
			testID="LNURLChannelSuccess"
			onButtonPress={handleAwesome}
		/>
	);
};

export default memo(LNURLChannelSuccess);
