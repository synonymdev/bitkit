import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import OnboardingScreen from '../../components/OnboardingScreen';
import { useAppDispatch } from '../../hooks/redux';
import { updateUser } from '../../store/slices/user';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/piggybank.png');

const SavingsIntro = ({
	navigation,
}: TransferScreenProps<'SavingsIntro'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const dispatch = useAppDispatch();

	const onClose = (): void => {
		navigation.navigate('Wallet');
	};

	const onContinue = (): void => {
		navigation.navigate('Availability');
		dispatch(updateUser({ savingsIntroSeen: true }));
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
			onClosePress={onClose}
			onButtonPress={onContinue}
		/>
	);
};

export default SavingsIntro;
