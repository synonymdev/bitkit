import React, { memo, ReactElement, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useBalance } from '../../hooks/wallet';
import useColors from '../../hooks/colors';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateSettings } from '../../store/slices/settings';
import { widgetsSelector } from '../../store/reselect/widgets';
import { refreshWallet } from '../../utils/wallet';
import ActivityListShort from '../../screens/Activity/ActivityListShort';
import DetectSwipe from '../../components/DetectSwipe';
import BalanceHeader from '../../components/BalanceHeader';
import Suggestions from '../../components/Suggestions';
import Widgets from '../../components/Widgets';
import SafeAreaInset from '../../components/SafeAreaInset';
import Balances from '../../components/Balances';
import Header from './Header';
import type { WalletScreenProps } from '../../navigation/types';
import {
	enableSwipeToHideBalanceSelector,
	hideBalanceSelector,
	hideOnboardingMessageSelector,
	showWidgetsSelector,
} from '../../store/reselect/settings';
import { showToast } from '../../utils/notifications';
import { ignoresHideBalanceToastSelector } from '../../store/reselect/user';
import { ignoreHideBalanceToast } from '../../store/slices/user';
import MainOnboarding from './MainOnboarding';

const HEADER_HEIGHT = 46;

type Props = WalletScreenProps<'Wallets'> & {
	onFocus: (isFocused: boolean) => void;
};

const Wallets = ({ navigation, onFocus }: Props): ReactElement => {
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
	const hideOnboardingSetting = useAppSelector(hideOnboardingMessageSelector);
	const showWidgets = useAppSelector(showWidgetsSelector);
	const widgets = useAppSelector(widgetsSelector);
	const insets = useSafeAreaInsets();
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
				visibilityTime: 5000,
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

	const hideOnboarding =
		hideOnboardingSetting ||
		totalBalance > 0 ||
		Object.keys(widgets).length > 0;

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
							<Suggestions />
							<View style={styles.contentPadding}>
								<Balances />
								{showWidgets && <Widgets />}
								<ActivityListShort />
							</View>
						</>
					) : (
						<MainOnboarding style={styles.contentPadding} />
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
