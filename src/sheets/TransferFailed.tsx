// NOTE: currently not used

import React, { memo, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheet from '../components/BottomSheet';
import BottomSheetScreen from '../components/BottomSheetScreen';
import { Display } from '../styles/text';

const imageSrc = require('../../assets/illustrations/cross.png');

const TransferFailed = (): ReactElement => {
	const { t } = useTranslation('lightning');

	const onCancel = (): void => {};

	const onContinue = async (): Promise<void> => {};

	return (
		<BottomSheet id="transferFailed" size="large">
			<BottomSheetScreen
				navTitle={t('transfer_failed.nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="transfer_failed.title"
						components={{ accent: <Display color="brand" /> }}
					/>
				}
				description={t('transfer_failed.text')}
				image={imageSrc}
				continueText={t('transfer_failed.continue')}
				cancelText={t('transfer_failed.cancel')}
				testID="TransferFailed"
				onContinue={onContinue}
				onCancel={onCancel}
			/>
		</BottomSheet>
	);
};

export default memo(TransferFailed);
