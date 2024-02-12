import React, {
	memo,
	ReactElement,
	useState,
	useCallback,
	useMemo,
} from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNoTransactions } from '../../hooks/wallet';
import useColors from '../../hooks/colors';
import { updateSettings } from '../../store/slices/settings';
import { widgetsSelector } from '../../store/reselect/widgets';
import { refreshWallet } from '../../utils/wallet';
import ActivityListShort from '../../screens/Activity/ActivityListShort';
import EmptyWallet from '../../screens/Activity/EmptyWallet';
import DetectSwipe from '../../components/DetectSwipe';
import BalanceHeader from '../../components/BalanceHeader';
import Suggestions from '../../components/Suggestions';
import Widgets from '../../components/Widgets';
import SafeAreaInset from '../../components/SafeAreaInset';
import BetaWarning from '../../components/BetaWarning';
import Assets from '../../components/Assets';
import Header from './Header';
import type { WalletScreenProps } from '../../navigation/types';
import {
	enableSwipeToHideBalanceSelector,
	hideBalanceSelector,
	hideOnboardingMessageSelector,
	showWidgetsSelector,
} from '../../store/reselect/settings';
import { showToast } from '../../utils/notifications';
import { useTranslation } from 'react-i18next';
import { ignoresHideBalanceToastSelector } from '../../store/reselect/user';
import { ignoreHideBalanceToast } from '../../store/slices/user';

const HEADER_HEIGHT = 46;

// Workaround for crash on Android
// https://github.com/software-mansion/react-native-reanimated/issues/4306#issuecomment-1538184321
const AnimatedRefreshControl = Animated.createAnimatedComponent(RefreshControl);

type Props = WalletScreenProps<'Wallets'> & {
	onFocus: (isFocused: boolean) => void;
};

const Wallets = ({ navigation, onFocus }: Props): ReactElement => {
	const [refreshing, setRefreshing] = useState(false);
	const colors = useColors();
	const dispatch = useAppDispatch();
	const enableSwipeToHideBalance = useAppSelector(
		enableSwipeToHideBalanceSelector,
	);
	const hideBalance = useAppSelector(hideBalanceSelector);
	const ignoresHideBalanceToast = useAppSelector(
		ignoresHideBalanceToastSelector,
	);
	const hideOnboardingSetting = useAppSelector(hideOnboardingMessageSelector);
	const showWidgets = useAppSelector(showWidgetsSelector);
	const widgets = useAppSelector(widgetsSelector);
	const noTransactions = useNoTransactions();
	const insets = useSafeAreaInsets();
	const empty = useMemo(() => {
		return noTransactions && Object.values(widgets).length === 0;
	}, [noTransactions, widgets]);
	const { t } = useTranslation('wallet');

	// tell WalletNavigator that this screen is focused
	useFocusEffect(
		useCallback(() => {
			onFocus(true);
			return (): void => onFocus(false);
		}, [onFocus]),
	);

	const toggleHideBalance = (): void => {
		const enabled = !hideBalance;
		dispatch(updateSettings({ hideBalance: enabled }));
		if (!ignoresHideBalanceToast && enabled) {
			showToast({
				type: 'info',
				title: t('balance_hidden_title'),
				description: t('balance_hidden_message'),
			});
			dispatch(ignoreHideBalanceToast());
		}
	};

	const navigateToScanner = (): void => {
		navigation.navigate('Scanner');
	};

	const navigateToProfile = (): void => {
		navigation.navigate('Profile');
	};

	const onRefresh = async (): Promise<void> => {
		setRefreshing(true);
		await refreshWallet({ scanAllAddresses: true });
		setRefreshing(false);
	};

	const hideOnboarding = hideOnboardingSetting || !empty;

	return (
		<>
			<SafeAreaInset type="top" />
			<View style={[styles.header, { top: insets.top }]}>
				<Header />
			</View>
			<DetectSwipe
				onSwipeLeft={navigateToScanner}
				onSwipeRight={navigateToProfile}>
				<ScrollView
					contentContainerStyle={[
						styles.content,
						hideOnboarding && styles.scrollView,
					]}
					disableScrollViewPanResponder={true}
					showsVerticalScrollIndicator={false}
					testID="WalletsScrollView"
					refreshControl={
						<AnimatedRefreshControl
							refreshing={refreshing}
							tintColor={colors.refreshControl}
							progressViewOffset={HEADER_HEIGHT}
							exiting={FadeOut}
							onRefresh={onRefresh}
						/>
					}>
					<DetectSwipe
						enabled={enableSwipeToHideBalance}
						onSwipeLeft={toggleHideBalance}
						onSwipeRight={toggleHideBalance}>
						<View>
							<BalanceHeader />
						</View>
					</DetectSwipe>

					{hideOnboarding ? (
						<>
							<Suggestions />
							<View style={styles.contentPadding}>
								<Assets />
								{showWidgets && <Widgets />}
								<ActivityListShort />
								<BetaWarning />
							</View>
						</>
					) : (
						<EmptyWallet />
					)}
				</ScrollView>
			</DetectSwipe>
		</>
	);
};

const styles = StyleSheet.create({
	header: {
		position: 'absolute',
		left: 0,
		right: 0,
		zIndex: 1,
	},
	content: {
		flexGrow: 1,
		paddingTop: HEADER_HEIGHT,
	},
	scrollView: {
		paddingBottom: 130,
	},
	contentPadding: {
		paddingHorizontal: 16,
	},
});

export default memo(Wallets);
