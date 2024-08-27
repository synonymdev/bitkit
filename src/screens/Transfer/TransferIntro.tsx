import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import OnboardingScreen from '../../components/OnboardingScreen';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/lightning.png');

const TransferIntro = ({
	navigation,
}: TransferScreenProps<'TransferIntro'>): ReactElement => {
	const { t } = useTranslation('lightning');

	const onContinue = (): void => {
		navigation.navigate('Funding');
	};

	return (
		<OnboardingScreen
			displayBackButton={false}
			title={
				<Trans
					t={t}
					i18nKey="transfer_intro.title"
					components={{ accent: <Display color="purple" /> }}
				/>
			}
			description={t('transfer_intro.text')}
			image={imageSrc}
			buttonText={t('transfer_intro.button')}
			testID="TransferIntro"
			onClosePress={(): void => {
				navigation.navigate('Wallet');
			}}
			onButtonPress={onContinue}
		/>
	);
};

export default TransferIntro;
