import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { BodyMB, Display } from '../../styles/text';
import InfoScreen from '../../components/InfoScreen';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const Interrupted = ({
	navigation,
}: TransferScreenProps<'Interrupted'>): ReactElement => {
	const { t } = useTranslation('lightning');

	const onContinue = (): void => {
		navigation.popToTop();
		navigation.goBack();
	};

	return (
		<InfoScreen
			navTitle={t('interrupted_title')}
			displayBackButton={false}
			title={
				<Trans
					t={t}
					i18nKey="timeout_header"
					components={{ accent: <Display color="purple" /> }}
				/>
			}
			description={
				<Trans
					t={t}
					i18nKey="timeout_text"
					components={{ accent: <BodyMB color="white" /> }}
				/>
			}
			image={imageSrc}
			buttonText={t('close')}
			testID="TransferInterrupted"
			onButtonPress={onContinue}
		/>
	);
};

export default memo(Interrupted);
