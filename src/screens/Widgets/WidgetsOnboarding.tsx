import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import OnboardingScreen from '../../components/OnboardingScreen';
import { useAppDispatch } from '../../hooks/redux';
import { RootStackParamList } from '../../navigation/types';
import { setWidgetsOnboarding } from '../../store/slices/widgets';
import { Display } from '../../styles/text';

const imageSrc = require('../../assets/illustrations/puzzle.png');

type WidgetsOnboardingProps = NativeStackScreenProps<
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
			onButtonPress={(): void => {
				dispatch(setWidgetsOnboarding(true));
				navigation.navigate('WidgetsSuggestions');
			}}
		/>
	);
};

export default WidgetsOnboarding;
