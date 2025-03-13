import React, { memo, ReactElement, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheet from '../components/BottomSheet';
import BottomSheetScreen from '../components/BottomSheetScreen';
import { __E2E__ } from '../constants/env';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useBalance } from '../hooks/wallet';
import {
	ignoreHighBalanceCountSelector,
	ignoreHighBalanceTimestampSelector,
} from '../store/reselect/user';
import { exchangeRatesSelector } from '../store/reselect/wallet';
import { MAX_WARNINGS, ignoreHighBalance } from '../store/slices/user';
import { BodyMB, Display } from '../styles/text';
import { getFiatDisplayValues } from '../utils/displayValues';
import { openURL } from '../utils/helpers';
import { useAllSheetRefs, useSheetRef } from './SheetRefsProvider';

const imageSrc = require('../assets/illustrations/exclamation-mark.png');

const BALANCE_THRESHOLD_USD = 500; // how high the balance must be to show this warning to the user (in USD)
const BALANCE_THRESHOLD_SATS = 700000; // how high the balance must be to show this warning to the user (in Sats)
const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 2500; // how long user needs to stay on the home screen before he will see this prompt

const sheetId = 'highBalance';

const HighBalanceWarning = (): ReactElement => {
	const { t } = useTranslation('other');
	const { totalBalance } = useBalance();
	const dispatch = useAppDispatch();
	const sheetRefs = useAllSheetRefs();
	const sheetRef = useSheetRef(sheetId);
	const count = useAppSelector(ignoreHighBalanceCountSelector);
	const exchangeRates = useAppSelector(exchangeRatesSelector);
	const ignoreTimestamp = useAppSelector(ignoreHighBalanceTimestampSelector);

	const { fiatValue } = getFiatDisplayValues({
		satoshis: totalBalance,
		currency: 'USD',
		exchangeRates,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: sheetRefs don't change
	useEffect(() => {
		// if balance over BALANCE_THRESHOLD
		// and not more than MAX_WARNINGS times
		// and user has not seen this prompt for ASK_INTERVAL
		// and no other bottom-sheets are shown
		// and user on home screen for CHECK_DELAY
		const shouldShow = () => {
			const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
			const isAnySheetOpen = sheetRefs.some(({ ref }) => ref.current?.isOpen());
			const belowMaxWarnings = count < MAX_WARNINGS;
			const thresholdReached =
				// fallback in case exchange rates are not available
				fiatValue !== 0
					? fiatValue > BALANCE_THRESHOLD_USD
					: totalBalance > BALANCE_THRESHOLD_SATS;

			return (
				!__E2E__ &&
				!isAnySheetOpen &&
				isTimeoutOver &&
				thresholdReached &&
				belowMaxWarnings
			);
		};

		const timer = setTimeout(() => {
			if (shouldShow()) {
				sheetRef.current?.present();
			}
		}, CHECK_DELAY);

		return () => clearTimeout(timer);
	}, [ignoreTimestamp, fiatValue, totalBalance, count]);

	const onMore = (): void => {
		openURL('https://en.bitcoin.it/wiki/Storing_bitcoins');
	};

	const onDismiss = (): void => {
		dispatch(ignoreHighBalance(true));
		sheetRef.current?.close();
	};

	return (
		<BottomSheet
			id={sheetId}
			size="large"
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
				showBackButton={false}
				continueText={t('high_balance.continue')}
				cancelText={t('high_balance.cancel')}
				testID="HighBalance"
				onContinue={onDismiss}
				onCancel={onMore}
			/>
		</BottomSheet>
	);
};

export default memo(HighBalanceWarning);
