import React, { memo, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text2';
import GradientView from '../../components/GradientView';
import BottomSheetScreen from '../../components/BottomSheetScreen';
import { UpgradeScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/check.png');

const Success = ({
	navigation,
}: UpgradeScreenProps<'Success'>): ReactElement => {
	const { t } = useTranslation('other');

	const onContinue = (): void => {
		navigation.navigate('Download');
	};

	return (
		<GradientView>
			<BottomSheetScreen
				navTitle={t('upgrade.success.nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="upgrade.success.title"
						components={{ accent: <Display color="brand2" /> }}
					/>
				}
				description={t('upgrade.success.text')}
				image={imageSrc}
				continueText={t('upgrade.success.continue')}
				onContinue={onContinue}
			/>
		</GradientView>
	);
};

export default memo(Success);
