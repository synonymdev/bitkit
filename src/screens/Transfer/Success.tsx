import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { BodyMB, Display } from '../../styles/text';
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
		navigation.popToTop();
		navigation.goBack();
	};

	const isTransferToSavings = type === 'savings';
	const title = isTransferToSavings ? 'ts_savings_title' : 'result_header';
	const description = isTransferToSavings ? 'ts_savings_text' : 'result_text';
	const buttonText = isTransferToSavings ? t('ok') : getRandomOkText();

	return (
		<InfoScreen
			navTitle={t('transfer.nav_successful')}
			displayBackButton={false}
			title={
				<Trans
					t={t}
					i18nKey={title}
					components={{ accent: <Display color="purple" /> }}
				/>
			}
			description={
				<Trans
					t={t}
					i18nKey={description}
					components={{ accent: <BodyMB color="white" /> }}
				/>
			}
			image={imageSrc}
			buttonText={buttonText}
			testID="TransferSuccess"
			onButtonPress={onContinue}
		/>
	);
};

export default memo(Success);
