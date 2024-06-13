import React, { ReactElement, memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleProp, ViewStyle } from 'react-native';

import WalletOnboarding from '../../components/WalletOnboarding';
import { useAppDispatch } from '../../hooks/redux';
import { useSlashfeed } from '../../hooks/widgets';
import { updateSettings } from '../../store/slices/settings';
import { setFeedWidget } from '../../store/slices/widgets';
import { Display } from '../../styles/text';
import { SUPPORTED_FEED_TYPES } from '../../utils/widgets';
import {
	BlocksFeedURL,
	NewsFeedURL,
	PriceFeedURL,
} from '../Widgets/WidgetsSuggestions';

const MainOnboarding = ({
	style,
}: {
	style: StyleProp<ViewStyle>;
}): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('onboarding');
	const { config: priceConfig } = useSlashfeed({ url: PriceFeedURL });
	const { config: newsConfig } = useSlashfeed({ url: NewsFeedURL });
	const { config: blocksConfig } = useSlashfeed({ url: BlocksFeedURL });

	const onHideOnboarding = (): void => {
		// add default widgets
		if (priceConfig) {
			dispatch(
				setFeedWidget({
					url: PriceFeedURL,
					type: SUPPORTED_FEED_TYPES.PRICE_FEED,
					fields: priceConfig.fields.filter((f) => f.name === 'BTC/USD'),
					extras: { period: '1D', showSource: false },
				}),
			);
		}

		if (newsConfig) {
			dispatch(
				setFeedWidget({
					url: NewsFeedURL,
					type: SUPPORTED_FEED_TYPES.HEADLINES_FEED,
					fields: newsConfig.fields,
				}),
			);
		}

		if (blocksConfig) {
			const fields = blocksConfig.fields.filter((f) => {
				return ['Block', 'Time', 'Date'].includes(f.name);
			});

			dispatch(
				setFeedWidget({
					url: BlocksFeedURL,
					type: SUPPORTED_FEED_TYPES.BLOCKS_FEED,
					fields,
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
