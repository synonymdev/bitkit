import React, { memo, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text2';
import BottomSheetScreen from '../../components/BottomSheetScreen';
import { UpgradeScreenProps } from '../../navigation/types';
import GradientView from '../../components/GradientView';

const imageSrc = require('../../assets/illustrations/transfer.png');

const Transfer = ({
	navigation,
}: UpgradeScreenProps<'Transfer'>): ReactElement => {
	const { t } = useTranslation('other');

	const onBack = (): void => {
		navigation.goBack();
	};

	const onContinue = (): void => {
		navigation.navigate('Pending');
	};

	return (
		<GradientView>
			<BottomSheetScreen
				navTitle={t('upgrade.transfer.nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="upgrade.transfer.title"
						components={{ accent: <Display color="brand2" /> }}
					/>
				}
				description={t('upgrade.transfer.text')}
				image={imageSrc}
				continueText={t('upgrade.transfer.continue')}
				cancelText={t('upgrade.transfer.cancel')}
				onContinue={onContinue}
				onCancel={onBack}
			/>
		</GradientView>
	);
};

export default memo(Transfer);
