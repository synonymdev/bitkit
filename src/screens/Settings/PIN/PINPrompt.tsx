import React, { memo, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheetScreen from '../../../components/BottomSheetScreen';
import { PinScreenProps } from '../../../navigation/types';
import { useSheetRef } from '../../../sheets/SheetRefsProvider';
import { Display } from '../../../styles/text';

const imageSrc = require('../../../assets/illustrations/shield.png');

const PINPrompt = ({
	navigation,
	route,
}: PinScreenProps<'PINPrompt'>): ReactElement => {
	const { t } = useTranslation('security');
	const showLaterButton = route.params?.showLaterButton ?? true;
	const sheetRef = useSheetRef('pinNavigation');

	const onContinue = (): void => {
		navigation.navigate('ChoosePIN');
	};

	const onDismiss = (): void => {
		sheetRef.current?.close();
	};

	return (
		<BottomSheetScreen
			navTitle={t('pin_security_header')}
			title={
				<Trans
					t={t}
					i18nKey="pin_security_title"
					components={{ accent: <Display color="green" /> }}
				/>
			}
			description={t('pin_security_text')}
			image={imageSrc}
			continueText={t('pin_security_button')}
			cancelText={showLaterButton ? t('later') : undefined}
			testID="SecureWallet"
			onContinue={onContinue}
			onCancel={onDismiss}
		/>
	);
};

export default memo(PINPrompt);
