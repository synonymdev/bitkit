import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleProp, ViewStyle } from 'react-native';

import WalletOnboarding from '../../components/WalletOnboarding';
import {
	blocksFeedUrl,
	newsFeedUrl,
	priceFeedUrl,
} from '../../constants/widgets';
import { useAppDispatch } from '../../hooks/redux';
import { useSlashfeedConfig } from '../../hooks/widgets';
import { updateSettings } from '../../store/slices/settings';
import { saveWidget } from '../../store/slices/widgets';
import { Display } from '../../styles/text';
import { SUPPORTED_FEED_TYPES } from '../../utils/widgets';

const MainOnboarding = ({
	style,
}: {
	style: StyleProp<ViewStyle>;
}): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('onboarding');
	const priceConfig = useSlashfeedConfig({ url: priceFeedUrl });
	const newsConfig = useSlashfeedConfig({ url: newsFeedUrl });
	const blocksConfig = useSlashfeedConfig({ url: blocksFeedUrl });

	const onHideOnboarding = (): void => {
		// add default widgets
		if (priceConfig) {
			dispatch(
				saveWidget({
					id: priceFeedUrl,
					options: {
						url: priceFeedUrl,
						type: SUPPORTED_FEED_TYPES.PRICE_FEED,
						fields: priceConfig.fields.filter((f) => f.name === 'BTC/USD'),
						extras: { period: '1D', showSource: false },
					},
				}),
			);
		}

		if (newsConfig) {
			dispatch(
				saveWidget({
					id: newsFeedUrl,
					options: {
						url: newsFeedUrl,
						type: SUPPORTED_FEED_TYPES.HEADLINES_FEED,
						fields: newsConfig.fields,
					},
				}),
			);
		}

		if (blocksConfig) {
			const fields = blocksConfig.fields.filter((f) => {
				return ['Block', 'Time', 'Date'].includes(f.name);
			});

			dispatch(
				saveWidget({
					id: blocksFeedUrl,
					options: {
						url: blocksFeedUrl,
						type: SUPPORTED_FEED_TYPES.BLOCKS_FEED,
						fields,
					},
				}),
			);
		}

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
