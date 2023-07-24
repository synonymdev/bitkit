import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { __E2E__ } from '../../constants/env';
import { Caption13Up, Display, Text02S } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import { ignoreHighBalance } from '../../store/actions/user';
import { closeBottomSheet, showBottomSheet } from '../../store/actions/ui';
import { viewControllersSelector } from '../../store/reselect/ui';
import { useBalance } from '../../hooks/wallet';
import { getFiatDisplayValues } from '../../utils/displayValues';
import { openURL } from '../../utils/helpers';
import { objectKeys } from '../../utils/objectKeys';
import { exchangeRatesSelector } from '../../store/reselect/wallet';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import {
	ignoreHighBalanceCountSelector,
	ignoreHighBalanceTimestampSelector,
} from '../../store/reselect/user';
import { EUnit } from '../../store/types/wallet';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

// TODO: change back after beta
// BALANCE_THRESHOLD_USD = 1000
// BALANCE_THRESHOLD_SATS = 5000000
// high_text2_beta -> high_text2
// and remove BETA variable
const BETA = true;
const BALANCE_THRESHOLD_USD = 100; // how high the balance must be to show this warning to the user (in USD)
const BALANCE_THRESHOLD_SATS = 500000; // how high the balance must be to show this warning to the user (in Sats)
const MAX_WARNINGS = 3; // how many times to show this warning to the user
const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 3000; // how long user needs to stay on Wallets screen before he will see this prompt

const Amount = ({ style }: { style?: StyleProp<ViewStyle> }): ReactElement => {
	return (
		<View style={[aStyles.root, style]}>
			<Display style={aStyles.symbol} color="gray2">
				$
			</Display>
			<Display>{BALANCE_THRESHOLD_USD}</Display>
		</View>
	);
};

const aStyles = StyleSheet.create({
	root: {
		flexDirection: 'row',
	},
	symbol: {
		marginRight: 4,
	},
});

const HighBalanceWarning = ({
	enabled,
}: {
	enabled: boolean;
}): ReactElement => {
	const { t } = useTranslation('other');
	const { totalBalance } = useBalance();
	const snapPoints = useSnapPoints('medium');
	const count = useSelector(ignoreHighBalanceCountSelector);
	const exchangeRates = useSelector(exchangeRatesSelector);
	const viewControllers = useSelector(viewControllersSelector);
	const ignoreTimestamp = useSelector(ignoreHighBalanceTimestampSelector);

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
		unit: EUnit.BTC,
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
		ignoreHighBalance(true);
		closeBottomSheet('highBalance');
	};

	return (
		<BottomSheetWrapper
			view="highBalance"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={ignoreHighBalance}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title={t('high_title')}
					displayBackButton={false}
				/>
				<View style={styles.amountContainer}>
					<Caption13Up color="gray1">{t('high_text1')}</Caption13Up>
					<Amount style={styles.amount} />
				</View>
				<Text02S style={styles.text} color="gray1">
					{t('high_text2_beta')}
				</Text02S>
				<GlowImage image={imageSrc} imageSize={180} glowColor="yellow" />
				<View style={styles.buttonContainer}>
					{!BETA && (
						<>
							<Button
								style={styles.button}
								variant="secondary"
								size="large"
								text={t('high_button_more')}
								onPress={onMore}
							/>
							<View style={styles.divider} />
						</>
					)}
					<Button
						style={styles.button}
						size="large"
						text={t('understood')}
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
		marginTop: 6,
	},
	text: {
		marginTop: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(HighBalanceWarning);
