import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import OnboardingScreen from '../../components/OnboardingScreen';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/coin-stack-x.png');

const SpendingIntro = ({
	navigation,
}: TransferScreenProps<'SpendingIntro'>): ReactElement => {
	const { t } = useTranslation('lightning');

	const onContinue = (): void => {
		navigation.navigate('SpendingAmount');
	};

	return (
		<OnboardingScreen
			navTitle={t('transfer.nav_title')}
			title={
				<Trans
					t={t}
					i18nKey="spending_intro.title"
					components={{ accent: <Display color="purple" /> }}
				/>
			}
			description={t('spending_intro.text')}
			image={imageSrc}
			buttonText={t('spending_intro.button')}
			testID="SpendingIntro"
			onClosePress={(): void => {
				navigation.navigate('Wallet');
			}}
			onButtonPress={onContinue}
		/>
	);
};

export default SpendingIntro;
