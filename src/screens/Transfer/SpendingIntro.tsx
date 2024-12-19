import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import OnboardingScreen from '../../components/OnboardingScreen';
import { useAppDispatch } from '../../hooks/redux';
import { updateUser } from '../../store/slices/user';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/coin-stack-x.png');

const SpendingIntro = ({
	navigation,
}: TransferScreenProps<'SpendingIntro'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const dispatch = useAppDispatch();

	const onContinue = (): void => {
		navigation.navigate('SpendingAmount');
		dispatch(updateUser({ spendingIntroSeen: true }));
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
			onButtonPress={onContinue}
		/>
	);
};

export default SpendingIntro;
