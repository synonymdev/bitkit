import React, { memo, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import RNExitApp from 'react-native-exit-app';

import { Display } from '../../styles/text2';
import GradientView from '../../components/GradientView';
import BottomSheetScreen from '../../components/BottomSheetScreen';
import { useAppDispatch } from '../../hooks/redux';
import { closeSheet } from '../../store/slices/ui';
import { hideTodo } from '../../store/slices/todos';
import { UpgradeScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/check.png');

const Complete = ({
	navigation,
}: UpgradeScreenProps<'Complete'>): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('other');

	const onBack = (): void => {
		navigation.goBack();
	};

	const onContinue = (): void => {
		dispatch(closeSheet('upgrade'));
		dispatch(hideTodo('upgrade'));

		// wait for dispatch
		setTimeout(() => RNExitApp.exitApp(), 1000);
	};

	return (
		<GradientView>
			<BottomSheetScreen
				navTitle={t('upgrade.complete.nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="upgrade.complete.title"
						components={{ accent: <Display color="brand2" /> }}
					/>
				}
				description={t('upgrade.complete.text')}
				image={imageSrc}
				continueText={t('upgrade.complete.continue')}
				cancelText={t('upgrade.complete.cancel')}
				onContinue={onContinue}
				onCancel={onBack}
			/>
		</GradientView>
	);
};

export default memo(Complete);
