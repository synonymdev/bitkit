import React, { memo, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display, BodyMB } from '../../styles/text2';
import GradientView from '../../components/GradientView';
import BottomSheetScreen from '../../components/BottomSheetScreen';
import { UpgradeScreenProps } from '../../navigation/types';
import { showBottomSheet } from '../../store/utils/ui';

const imageSrc = require('../../assets/illustrations/restore.png');

const Restore = ({
	navigation,
}: UpgradeScreenProps<'Restore'>): ReactElement => {
	const { t } = useTranslation('other');

	const onSeed = (): void => {
		showBottomSheet('backupNavigation');
	};

	const onBack = (): void => {
		navigation.goBack();
	};

	const onContinue = (): void => {
		navigation.navigate('Complete');
	};

	return (
		<GradientView>
			<BottomSheetScreen
				navTitle={t('upgrade.restore.nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="upgrade.restore.title"
						components={{ accent: <Display color="brand2" /> }}
					/>
				}
				description={
					<Trans
						t={t}
						i18nKey="upgrade.restore.text"
						components={{
							bold: <BodyMB color="white" />,
							brand: <BodyMB color="brand2" onPress={onSeed} />,
						}}
					/>
				}
				image={imageSrc}
				continueText={t('upgrade.restore.continue')}
				cancelText={t('upgrade.restore.cancel')}
				onContinue={onContinue}
				onCancel={onBack}
			/>
		</GradientView>
	);
};

export default memo(Restore);
