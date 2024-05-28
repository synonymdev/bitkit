import React, { ReactElement } from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import { useAppDispatch } from '../../hooks/redux';
import { setOnboardedContacts } from '../../store/slices/slashtags';
import { RootStackParamList } from '../../navigation/types';
import OnboardingScreen from '../../components/OnboardingScreen';

const imageSrc = require('../../assets/illustrations/group.png');

type ContactsOnboardingProps = StackScreenProps<RootStackParamList, 'Contacts'>;

const ContactsOnboarding = ({
	navigation,
}: ContactsOnboardingProps): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();

	return (
		<OnboardingScreen
			navTitle={t('contacts')}
			title={
				<Trans
					t={t}
					i18nKey="onboarding_header"
					components={{ accent: <Display color="brand" /> }}
				/>
			}
			description={t('onboarding_text')}
			image={imageSrc}
			buttonText={t('onboarding_button')}
			testID="ContactsOnboarding"
			onClosePress={(): void => {
				navigation.navigate('Wallet');
			}}
			onButtonPress={(): void => {
				dispatch(setOnboardedContacts(true));
			}}
		/>
	);
};

export default ContactsOnboarding;
