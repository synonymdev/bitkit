import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheetScreen from '../../components/BottomSheetScreen';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useBalance } from '../../hooks/wallet';
import { viewControllersSelector } from '../../store/reselect/ui';
import {
	ignoreHighBalanceCountSelector,
	ignoreHighBalanceTimestampSelector,
} from '../../store/reselect/user';
import { exchangeRatesSelector } from '../../store/reselect/wallet';
import { closeSheet } from '../../store/slices/ui';
import { MAX_WARNINGS, ignoreHighBalance } from '../../store/slices/user';
import { showBottomSheet } from '../../store/utils/ui';
import { BodyMB, Display } from '../../styles/text';
import { getFiatDisplayValues } from '../../utils/displayValues';
import { openURL } from '../../utils/helpers';
import { objectKeys } from '../../utils/objectKeys';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const BALANCE_THRESHOLD_USD = 500; // how high the balance must be to show this warning to the user (in USD)
const BALANCE_THRESHOLD_SATS = 700000; // how high the balance must be to show this warning to the user (in Sats)
const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 3000; // how long user needs to stay on Wallets screen before he will see this prompt

const HighBalanceWarning = ({
	enabled,
}: {
	enabled: boolean;
}): ReactElement => {
	const { t } = useTranslation('other');
	const { totalBalance } = useBalance();
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();
	const count = useAppSelector(ignoreHighBalanceCountSelector);
	const exchangeRates = useAppSelector(exchangeRatesSelector);
	const viewControllers = useAppSelector(viewControllersSelector);
	const ignoreTimestamp = useAppSelector(ignoreHighBalanceTimestampSelector);

	useBottomSheetBackPress('highBalance');

	const anyBottomSheetIsOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys
			.filter((view) => view !== 'highBalance')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	const { fiatValue } = getFiatDisplayValues({
		satoshis: totalBalance,
		currency: 'USD',
		exchangeRates,
	});

	// if balance over BALANCE_THRESHOLD
	// and not more than MAX_WARNINGS times
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const shouldShowBottomSheet = useMemo(() => {
		const thresholdReached =
			// fallback in case exchange rates are not available
			fiatValue !== 0
				? fiatValue > BALANCE_THRESHOLD_USD
				: totalBalance > BALANCE_THRESHOLD_SATS;
		const belowMaxWarnings = count < MAX_WARNINGS;
		const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
		return (
			enabled &&
			!__E2E__ &&
			thresholdReached &&
			belowMaxWarnings &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [
		enabled,
		fiatValue,
		totalBalance,
		count,
		ignoreTimestamp,
		anyBottomSheetIsOpen,
	]);

	useEffect(() => {
		if (!shouldShowBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			showBottomSheet('highBalance');
		}, CHECK_DELAY);

		return (): void => {
			clearTimeout(timer);
		};
	}, [shouldShowBottomSheet]);

	const onMore = (): void => {
		openURL('https://en.bitcoin.it/wiki/Storing_bitcoins');
	};

	const onDismiss = (): void => {
		dispatch(ignoreHighBalance(true));
		dispatch(closeSheet('highBalance'));
	};

	return (
		<BottomSheetWrapper
			view="highBalance"
			snapPoints={snapPoints}
			onClose={(): void => {
				dispatch(ignoreHighBalance(false));
			}}>
			<BottomSheetScreen
				navTitle={t('high_balance.nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="high_balance.title"
						components={{ accent: <Display color="yellow" /> }}
					/>
				}
				description={
					<Trans
						t={t}
						i18nKey="high_balance.text"
						components={{ accent: <BodyMB color="white" /> }}
					/>
				}
				image={imageSrc}
				continueText={t('high_balance.continue')}
				cancelText={t('high_balance.cancel')}
				testID="HighBalance"
				onContinue={onDismiss}
				onCancel={onMore}
			/>
		</BottomSheetWrapper>
	);
};

export default memo(HighBalanceWarning);
