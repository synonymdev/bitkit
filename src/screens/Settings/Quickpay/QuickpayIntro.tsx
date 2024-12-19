import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../../styles/text';
import OnboardingScreen from '../../../components/OnboardingScreen';
import { useAppDispatch } from '../../../hooks/redux';
import { updateUser } from '../../../store/slices/user';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/fast-forward.png');

const QuickpayIntro = ({
	navigation,
}: SettingsScreenProps<'QuickpayIntro'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();

	return (
		<OnboardingScreen
			navTitle={t('quickpay.nav_title')}
			title={
				<Trans
					t={t}
					i18nKey="quickpay.intro.title"
					components={{ accent: <Display color="green" /> }}
				/>
			}
			description={t('quickpay.intro.description')}
			image={imageSrc}
			imagePosition="center"
			buttonText={t('continue')}
			testID="QuickpayIntro"
			onButtonPress={(): void => {
				dispatch(updateUser({ quickpayIntroSeen: true }));
				navigation.navigate('QuickpaySettings');
			}}
		/>
	);
};

export default QuickpayIntro;
