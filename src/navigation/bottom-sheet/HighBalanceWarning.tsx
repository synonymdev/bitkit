import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { __E2E__ } from '../../constants/env';
import { Caption13Up, Display, BodyM } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import { ignoreHighBalance, MAX_WARNINGS } from '../../store/slices/user';
import { viewControllersSelector } from '../../store/reselect/ui';
import { useBalance } from '../../hooks/wallet';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
	getFiatDisplayValues,
	getFiatDisplayValuesForFiat,
} from '../../utils/displayValues';
import { openURL } from '../../utils/helpers';
import { objectKeys } from '../../utils/objectKeys';
import { exchangeRatesSelector } from '../../store/reselect/wallet';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { closeSheet } from '../../store/slices/ui';
import { showBottomSheet } from '../../store/utils/ui';
import {
	ignoreHighBalanceCountSelector,
	ignoreHighBalanceTimestampSelector,
} from '../../store/reselect/user';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const BALANCE_THRESHOLD_USD = 500; // how high the balance must be to show this warning to the user (in USD)
const BALANCE_THRESHOLD_SATS = 650000; // how high the balance must be to show this warning to the user (in Sats)
const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 3000; // how long user needs to stay on Wallets screen before he will see this prompt

const HighBalanceWarning = ({
	enabled,
}: {
	enabled: boolean;
}): ReactElement => {
	const { t } = useTranslation('other');
	const { totalBalance } = useBalance();
	const snapPoints = useSnapPoints('medium');
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

	const { fiatWhole, fiatSymbol } = getFiatDisplayValuesForFiat({
		value: BALANCE_THRESHOLD_USD,
		currency: 'USD',
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
			backdrop={true}
			onClose={(): void => {
				dispatch(ignoreHighBalance(false));
			}}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title={t('high_title')}
					displayBackButton={false}
				/>
				<View style={styles.amountContainer}>
					<Caption13Up color="secondary">{t('high_text1')}</Caption13Up>
					<View style={styles.amount}>
						<Display style={styles.symbol} color="secondary">
							{fiatSymbol}
						</Display>
						<Display>{fiatWhole}</Display>
					</View>
				</View>

				<BodyM style={styles.text} color="secondary">
					{t('high_text2')}
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('high_button_more')}
						variant="secondary"
						size="large"
						onPress={onMore}
					/>
					<Button
						style={styles.button}
						text={t('understood')}
						size="large"
						onPress={onDismiss}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 32,
	},
	amountContainer: {
		marginTop: 8,
	},
	amount: {
		flexDirection: 'row',
		marginTop: 12,
	},
	symbol: {
		marginRight: 8,
	},
	text: {
		marginTop: 16,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(HighBalanceWarning);
