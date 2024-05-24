import React, { ReactElement } from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import { useAppDispatch } from '../../hooks/redux';
import { RootStackParamList } from '../../navigation/types';
import { setWidgetsOnboarding } from '../../store/slices/widgets';
import OnboardingScreen from '../../components/OnboardingScreen';

const imageSrc = require('../../assets/illustrations/puzzle.png');

type WidgetsOnboardingProps = StackScreenProps<
	RootStackParamList,
	'WidgetsOnboarding'
>;

const WidgetsOnboarding = ({
	navigation,
}: WidgetsOnboardingProps): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();

	return (
		<OnboardingScreen
			title={
				<Trans
					t={t}
					i18nKey="onboarding_widgets_header"
					components={{ accent: <Display color="brand" /> }}
				/>
			}
			description={t('onboarding_widgets_text')}
			image={imageSrc}
			buttonText={t('continue')}
			testID="WidgetsOnboarding"
			onClosePress={(): void => {
				navigation.navigate('Wallet');
			}}
			onButtonPress={(): void => {
				dispatch(setWidgetsOnboarding(true));
				navigation.navigate('WidgetsSuggestions');
			}}
		/>
	);
};

export default WidgetsOnboarding;
