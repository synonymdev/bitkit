import React, { memo, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheetScreen from '../../../components/BottomSheetScreen';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { PinScreenProps } from '../../../navigation/types';
import { showLaterButtonSelector } from '../../../store/reselect/ui';
import { closeSheet } from '../../../store/slices/ui';
import { Display } from '../../../styles/text';

const imageSrc = require('../../../assets/illustrations/shield.png');

const PINPrompt = ({
	navigation,
}: PinScreenProps<'PINPrompt'>): ReactElement => {
	const { t } = useTranslation('security');
	const dispatch = useAppDispatch();
	const showLaterButton = useAppSelector(showLaterButtonSelector);

	useBottomSheetBackPress('PINNavigation');

	const onContinue = (): void => {
		navigation.navigate('ChoosePIN');
	};

	const onDismiss = (): void => {
		dispatch(closeSheet('PINNavigation'));
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
