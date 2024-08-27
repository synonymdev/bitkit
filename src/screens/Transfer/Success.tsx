import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import InfoScreen from '../../components/InfoScreen';
import { getRandomOkText } from '../../utils/i18n/helpers';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/check.png');

const Success = ({
	navigation,
	route,
}: TransferScreenProps<'Success'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { type } = route.params;

	const onContinue = (): void => {
		navigation.navigate('Wallet', { screen: 'Wallets' });
	};

	const isTransferToSavings = type === 'savings';
	const title = isTransferToSavings ? 'title_savings' : 'title_spending';
	const description = isTransferToSavings ? 'text_savings' : 'text_spending';
	const buttonText = isTransferToSavings ? t('ok') : getRandomOkText();
	const accentColor = isTransferToSavings ? 'brand' : 'purple';

	return (
		<InfoScreen
			navTitle={t('transfer_success.nav_title')}
			displayBackButton={false}
			title={
				<Trans
					t={t}
					i18nKey={`transfer_success.${title}`}
					components={{ accent: <Display color={accentColor} /> }}
				/>
			}
			description={t(`transfer_success.${description}`)}
			image={imageSrc}
			buttonText={buttonText}
			testID="TransferSuccess"
			onButtonPress={onContinue}
		/>
	);
};

export default memo(Success);
