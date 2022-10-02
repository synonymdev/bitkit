import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Caption13Up, Display, Text02S } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/Button';
import { ignoreHighBalance, toggleView } from '../../store/actions/user';
import Glow from '../../components/Glow';
import Store from '../../store/types';
import { useBalance } from '../../hooks/wallet';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { getFiatDisplayValues } from '../../utils/exchange-rate';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const BALANCE_THRESHOLD_USD = 1000; // how high the balance must be to show this warning to the user (in USD)
const BALANCE_THRESHOLD_SATS = 5000000; // how high the balance must be to show this warning to the user (in Sats)
const MAX_WARNINGS = 3; // how many times to show this warning to the user
const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_INTERVAL = 3_000; // how long user needs to stay on Wallets screen before he will see this prompt

const Amount = ({ style }: { style?: StyleProp<ViewStyle> }) => {
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

const HighBalanceWarning = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const balance = useBalance({ onchain: true, lightning: true });
	const count = useSelector(
		(state: Store) => state.user.ignoreHighBalanceCount,
	);
	const ignoreTimestamp = useSelector(
		(state: Store) => state.user.ignoreHighBalanceTimestamp,
	);
	const anyBottomSheetIsOpen = useSelector((state: Store) => {
		return Object.values(state.user.viewController).some(
			({ isOpen }) => isOpen,
		);
	});

	useBottomSheetBackPress('highBalance');

	const { fiatValue } = getFiatDisplayValues({
		satoshis: balance.satoshis,
		currency: 'USD',
	});

	const thresholdReached =
		// fallback in case exchange rates are not available
		fiatValue !== 0
			? fiatValue > BALANCE_THRESHOLD_USD
			: balance.satoshis > BALANCE_THRESHOLD_SATS;

	const showBottomSheet =
		thresholdReached && count < MAX_WARNINGS && !anyBottomSheetIsOpen;

	// if balance over BALANCE_THRESHOLD
	// and user on "Wallets" screen for CHECK_INTERVAL
	// and no other bottom-sheets are shown
	// and user has not seen this prompt for ASK_INTERVAL
	// and not more than MAX_WARNINGS times
	// show HighBalanceWarning
	useEffect(() => {
		if (!showBottomSheet) {
			return;
		}

		const timer = setInterval(() => {
			const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
			if (!isTimeoutOver) {
				return;
			}

			toggleView({
				view: 'highBalance',
				data: { isOpen: true },
			});
		}, CHECK_INTERVAL);

		return (): void => {
			clearInterval(timer);
		};
	}, [showBottomSheet, ignoreTimestamp]);

	const onMore = (): void => {
		console.log('TODO: show more...');
	};

	const onDismiss = (): void => {
		ignoreHighBalance();
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

				<View style={styles.imageContainer}>
					<Glow style={styles.glow} size={500} color="yellow" />
					<Image source={imageSrc} style={styles.image} />
				</View>

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
		marginTop: 30,
	},
	amount: {
		marginTop: 6,
	},
	text: {
		marginTop: 16,
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: 180,
		height: 180,
	},
	glow: {
		position: 'absolute',
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
