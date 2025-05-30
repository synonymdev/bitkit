import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import OnboardingScreen from '../../components/OnboardingScreen';
import { useAppDispatch } from '../../hooks/redux';
import type { TransferScreenProps } from '../../navigation/types';
import { updateSettings } from '../../store/slices/settings';
import { Display } from '../../styles/text';

const imageSrc = require('../../assets/illustrations/piggybank.png');

const SavingsIntro = ({
	navigation,
}: TransferScreenProps<'SavingsIntro'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const dispatch = useAppDispatch();

	const onContinue = (): void => {
		navigation.navigate('Availability');
		dispatch(updateSettings({ savingsIntroSeen: true }));
	};

	return (
		<OnboardingScreen
			navTitle={t('transfer.nav_title')}
			title={
				<Trans
					t={t}
					i18nKey="savings_intro.title"
					components={{ accent: <Display color="brand" /> }}
				/>
			}
			description={t('savings_intro.text')}
			image={imageSrc}
			buttonText={t('savings_intro.button')}
			mirrorImage={true}
			testID="SavingsIntro"
			onButtonPress={onContinue}
		/>
	);
};

export default SavingsIntro;
