import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import InfoScreen from '../../components/InfoScreen';
import type { TransferScreenProps } from '../../navigation/types';
import { BodyMB, Display } from '../../styles/text';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const Interrupted = ({
	navigation,
}: TransferScreenProps<'Interrupted'>): ReactElement => {
	const { t } = useTranslation('lightning');

	const onContinue = (): void => {
		navigation.popTo('Wallet', { screen: 'Home' });
	};

	return (
		<InfoScreen
			navTitle={t('savings_interrupted.nav_title')}
			title={
				<Trans
					t={t}
					i18nKey="savings_interrupted.title"
					components={{ accent: <Display color="brand" /> }}
				/>
			}
			description={
				<Trans
					t={t}
					i18nKey="savings_interrupted.text"
					components={{ accent: <BodyMB color="white" /> }}
				/>
			}
			image={imageSrc}
			buttonText={t('ok')}
			showBackButton={false}
			showCloseButton={false}
			testID="TransferInterrupted"
			onButtonPress={onContinue}
		/>
	);
};

export default memo(Interrupted);
