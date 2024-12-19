import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import OnboardingScreen from '../../components/OnboardingScreen';
import { useAppDispatch } from '../../hooks/redux';
import { updateUser } from '../../store/slices/user';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/lightning.png');

const TransferIntro = ({
	navigation,
}: TransferScreenProps<'TransferIntro'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const dispatch = useAppDispatch();

	const onContinue = (): void => {
		navigation.navigate('Funding');
		dispatch(updateUser({ transferIntroSeen: true }));
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
