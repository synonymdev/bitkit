import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Caption13Up, Display, Text02S } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import { ignoreHighBalance } from '../../store/actions/user';
import { toggleView } from '../../store/actions/ui';
import { viewControllersSelector } from '../../store/reselect/ui';
import { useBalance } from '../../hooks/wallet';
import { useAppSelector } from '../../hooks/redux';
import { getFiatDisplayValues } from '../../utils/exchange-rate';
import { openURL } from '../../utils/helpers';
import { objectKeys } from '../../utils/objectKeys';
import { bitcoinUnitSelector } from '../../store/reselect/settings';
import { exchangeRatesSelector } from '../../store/reselect/wallet';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import {
	ignoreHighBalanceCountSelector,
	ignoreHighBalanceTimestampSelector,
} from '../../store/reselect/user';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const BALANCE_THRESHOLD_USD = 1000; // how high the balance must be to show this warning to the user (in USD)
const BALANCE_THRESHOLD_SATS = 5000000; // how high the balance must be to show this warning to the user (in Sats)
const MAX_WARNINGS = 3; // how many times to show this warning to the user
const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 3000; // how long user needs to stay on Wallets screen before he will see this prompt

const Amount = ({ style }: { style?: StyleProp<ViewStyle> }): ReactElement => {
	return (
		<View style={[aStyles.root, style]}>
			<Display style={aStyles.symbol} color="gray2">
				$
			</Display>
			<Display>1,000</Display>
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
	const snapPoints = useSnapPoints('medium');
	const insets = useSafeAreaInsets();
	const balance = useBalance({ onchain: true, lightning: true });
	const count = useAppSelector(ignoreHighBalanceCountSelector);
	const bitcoinUnit = useAppSelector(bitcoinUnitSelector);
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

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const { fiatValue } = getFiatDisplayValues({
		satoshis: balance.satoshis,
		currency: 'USD',
		bitcoinUnit,
		exchangeRates,
	});

	// if balance over BALANCE_THRESHOLD
	// and not more than MAX_WARNINGS times
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const showBottomSheet = useMemo(() => {
		const thresholdReached =
			// fallback in case exchange rates are not available
			fiatValue !== 0
				? fiatValue > BALANCE_THRESHOLD_USD
				: balance.satoshis > BALANCE_THRESHOLD_SATS;
		const belowMaxWarnings = count < MAX_WARNINGS;
		const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
		return (
			enabled &&
			thresholdReached &&
			belowMaxWarnings &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [
		enabled,
		fiatValue,
		balance.satoshis,
		count,
		ignoreTimestamp,
		anyBottomSheetIsOpen,
	]);

	useEffect(() => {
		if (!showBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			toggleView({
				view: 'highBalance',
				data: { isOpen: true },
			});
		}, CHECK_DELAY);

		return (): void => {
			clearInterval(timer);
		};
	}, [showBottomSheet]);

	const onMore = (): void => {
		openURL('https://en.bitcoin.it/wiki/Storing_bitcoins');
	};

	const onDismiss = (): void => {
		ignoreHighBalance(true);
		toggleView({
			view: 'highBalance',
			data: { isOpen: false },
		});
	};

	return (
		<BottomSheetWrapper
			view="highBalance"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={ignoreHighBalance}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title="High Wallet Balance (!)"
					displayBackButton={false}
				/>

				<View style={styles.amountContainer}>
					<Caption13Up color="gray1">Wallet balance exceeds</Caption13Up>
					<Amount style={styles.amount} />
				</View>

				<Text02S style={styles.text} color="gray1">
					For safety reasons, we recommend moving some of your savings to an
					offline cold wallet or multisig solution.
				</Text02S>

				<GlowImage image={imageSrc} imageSize={180} glowColor="yellow" />

				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						text="Learn More"
						onPress={onMore}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="large"
						text="Understood"
						onPress={onDismiss}
					/>
				</View>
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
