import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import OnboardingScreen from '../../components/OnboardingScreen';
import { useAppDispatch } from '../../hooks/redux';
import type { TransferScreenProps } from '../../navigation/types';
import { updateSettings } from '../../store/slices/settings';
import { Display } from '../../styles/text';

const imageSrc = require('../../assets/illustrations/lightning.png');

const TransferIntro = ({
	navigation,
}: TransferScreenProps<'TransferIntro'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const dispatch = useAppDispatch();

	const onContinue = (): void => {
		navigation.navigate('Funding');
		dispatch(updateSettings({ transferIntroSeen: true }));
	};

	return (
		<OnboardingScreen
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
			showBackButton={false}
			testID="TransferIntro"
			onButtonPress={onContinue}
		/>
	);
};

export default TransferIntro;
