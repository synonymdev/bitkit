import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { BodyMB, Display } from '../../../styles/text';
import InfoScreen from '../../../components/InfoScreen';
import { getRandomOkText } from '../../../utils/i18n/helpers';
import type { TransferScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/switch.png');

const ExternalSuccess = ({
	navigation,
}: TransferScreenProps<'ExternalSuccess'>): ReactElement => {
	const { t } = useTranslation('lightning');

	const onContinue = (): void => {
		navigation.navigate('Wallet', { screen: 'Wallets' });
	};

	return (
		<InfoScreen
			navTitle={t('external.nav_title')}
			displayBackButton={false}
			title={
				<Trans
					t={t}
					i18nKey="external_success.title"
					components={{ accent: <Display color="purple" /> }}
				/>
			}
			description={
				<Trans
					t={t}
					i18nKey="external_success.text"
					components={{ accent: <BodyMB color="white" /> }}
				/>
			}
			image={imageSrc}
			buttonText={getRandomOkText()}
			testID="ExternalSuccess"
			onClosePress={onContinue}
			onButtonPress={onContinue}
		/>
	);
};

export default memo(ExternalSuccess);
