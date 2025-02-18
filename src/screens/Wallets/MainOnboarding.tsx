import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleProp, ViewStyle } from 'react-native';

import WalletOnboarding from '../../components/WalletOnboarding';
import { useAppDispatch } from '../../hooks/redux';
import { updateSettings } from '../../store/slices/settings';
import { saveWidget } from '../../store/slices/widgets';
import { Display } from '../../styles/text';
import { getDefaultOptions } from '../../utils/widgets';

const MainOnboarding = ({
	style,
}: {
	style: StyleProp<ViewStyle>;
}): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('onboarding');
	const priceOptions = getDefaultOptions('price');
	const newsOptions = getDefaultOptions('news');
	const blocksOptions = getDefaultOptions('blocks');

	const onHideOnboarding = (): void => {
		dispatch(saveWidget({ id: 'price', options: priceOptions }));
		dispatch(saveWidget({ id: 'news', options: newsOptions }));
		dispatch(saveWidget({ id: 'blocks', options: blocksOptions }));
		dispatch(updateSettings({ hideOnboardingMessage: true }));
	};

	return (
		<WalletOnboarding
			style={style}
			onHide={onHideOnboarding}
			text={
				<Trans
					t={t}
					i18nKey="empty_wallet"
					components={{ accent: <Display color="brand" /> }}
				/>
			}
		/>
	);
};

export default memo(MainOnboarding);
