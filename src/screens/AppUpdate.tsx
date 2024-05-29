import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../styles/text';
import OnboardingScreen from '../components/OnboardingScreen';
import { useAppSelector } from '../hooks/redux';
import { openURL } from '../utils/helpers';
import { availableUpdateSelector } from '../store/reselect/ui';

const imageSrc = require('../assets/illustrations/exclamation-mark.png');

const AppUpdate = (): ReactElement => {
	const { t } = useTranslation('other');
	const updateInfo = useAppSelector(availableUpdateSelector);

	const onUpdate = async (): Promise<void> => {
		await openURL(updateInfo?.url!);
	};

	return (
		<OnboardingScreen
			disableNav
			navTitle={t('update_critical_nav_title')}
			title={
				<Trans
					t={t}
					i18nKey="update_critical_title"
					components={{ accent: <Display color="brand" /> }}
				/>
			}
			description={t('update_critical_text')}
			image={imageSrc}
			imagePosition="center"
			buttonText={t('update_critical_button')}
			testID="CriticalUpdate"
			onButtonPress={onUpdate}
		/>
	);
};

export default AppUpdate;
