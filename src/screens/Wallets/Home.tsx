import React, { memo, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BalanceHeader from '../../components/BalanceHeader';
import Balances from '../../components/Balances';
import DetectSwipe from '../../components/DetectSwipe';
import SafeAreaInset from '../../components/SafeAreaInset';
import Suggestions from '../../components/Suggestions';
import Widgets from '../../components/Widgets';
import useColors from '../../hooks/colors';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useBalance } from '../../hooks/wallet';
import AppUpdatePrompt from '../../navigation/bottom-sheet/AppUpdatePrompt';
import BackupPrompt from '../../navigation/bottom-sheet/BackupPrompt';
import HighBalanceWarning from '../../navigation/bottom-sheet/HighBalanceWarning';
import QuickPayPrompt from '../../navigation/bottom-sheet/QuickPayPrompt';
import ActivityListShort from '../../screens/Activity/ActivityListShort';
import {
	enableSwipeToHideBalanceSelector,
	hideBalanceSelector,
	hideOnboardingMessageSelector,
	showWidgetsSelector,
} from '../../store/reselect/settings';
import {
	ignoresHideBalanceToastSelector,
	scanAllAddressesTimestampSelector,
} from '../../store/reselect/user';
import { updateSettings } from '../../store/slices/settings';
import { ignoreHideBalanceToast, updateUser } from '../../store/slices/user';
import { View as ThemedView } from '../../styles/components';
import { showToast } from '../../utils/notifications';
import { refreshWallet } from '../../utils/wallet';
import Header from './Header';
import MainOnboarding from './MainOnboarding';

const HEADER_HEIGHT = 46;

const Home = (): ReactElement => {
	const [refreshing, setRefreshing] = useState(false);
	const colors = useColors();
	const dispatch = useAppDispatch();
	const { totalBalance } = useBalance();
	const enableSwipeToHideBalance = useAppSelector(
		enableSwipeToHideBalanceSelector,
	);
	const hideBalance = useAppSelector(hideBalanceSelector);
	const ignoresHideBalanceToast = useAppSelector(
		ignoresHideBalanceToastSelector,
	);
	const scanAllAddressesTimestamp = useAppSelector(
		scanAllAddressesTimestampSelector,
	);
	const hideOnboardingSetting = useAppSelector(hideOnboardingMessageSelector);
	const showWidgets = useAppSelector(showWidgetsSelector);
	const insets = useSafeAreaInsets();
	const { t } = useTranslation('wallet');

	const toggleHideBalance = (): void => {
		const enabled = !hideBalance;
		dispatch(updateSettings({ hideBalance: enabled }));
		if (!ignoresHideBalanceToast && enabled) {
			showToast({
				type: 'info',
				title: t('balance_hidden_title'),
				description: t('balance_hidden_message'),
				visibilityTime: 5000,
			});
			dispatch(ignoreHideBalanceToast());
		}
	};

	const onRefresh = async (): Promise<void> => {
		// only scan all addresses once per hour
		const scanAllAddresses =
			Date.now() - scanAllAddressesTimestamp > 1000 * 60 * 60;
		dispatch(updateUser({ scanAllAddressesTimestamp: Date.now() }));
		setRefreshing(true);
		await refreshWallet({ scanAllAddresses });
		setRefreshing(false);
	};

	const hideOnboarding = hideOnboardingSetting || totalBalance > 0;

	return (
		<>
			<ThemedView style={styles.root}>
				<SafeAreaInset type="top" />
				{/* Need this wrapper for Android e2e tests */}
				<View style={[styles.header, { top: insets.top }]}>
					<Header />
				</View>

				<ScrollView
					contentContainerStyle={[
						styles.content,
						hideOnboarding && styles.scrollView,
					]}
					disableScrollViewPanResponder={true}
					showsVerticalScrollIndicator={false}
					testID="HomeScrollView"
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							tintColor={colors.refreshControl}
							progressViewOffset={HEADER_HEIGHT}
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
							<Balances />
							<Suggestions />
							<View style={styles.contentPadding}>
								{showWidgets && <Widgets />}
								<ActivityListShort />
							</View>
						</>
					) : (
						<MainOnboarding style={styles.contentPadding} />
					)}
				</ScrollView>
			</ThemedView>

			{/* Timed/conditional bottom-sheets */}
			<BackupPrompt />
			<HighBalanceWarning />
			<AppUpdatePrompt />
			<QuickPayPrompt />
		</>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
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

export default memo(Home);
