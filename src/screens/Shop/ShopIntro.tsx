import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import OnboardingScreen from '../../components/OnboardingScreen';
import { useAppDispatch } from '../../hooks/redux';
import { RootStackParamList } from '../../navigation/types';
import { updateSettings } from '../../store/slices/settings';
import { Display } from '../../styles/text';

const imageSrc = require('../../assets/illustrations/shopping-bag.png');

type ShopIntroProps = NativeStackScreenProps<RootStackParamList, 'ShopIntro'>;

const ShopIntro = ({ navigation }: ShopIntroProps): ReactElement => {
	const { t } = useTranslation('other');
	const dispatch = useAppDispatch();

	return (
		<OnboardingScreen
			title={<Display color="yellow">{t('shop.intro.title')}</Display>}
			description={t('shop.intro.description')}
			image={imageSrc}
			buttonText={t('shop.intro.button')}
			testID="ShopIntro"
			onButtonPress={(): void => {
				dispatch(updateSettings({ shopIntroSeen: true }));
				navigation.navigate('ShopDiscover');
			}}
		/>
	);
};

export default ShopIntro;
