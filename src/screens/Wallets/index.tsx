import React, {
	memo,
	ReactElement,
	useState,
	useCallback,
	useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';

import { View } from '../../styles/components';
import { useNoTransactions } from '../../hooks/wallet';
import useColors from '../../hooks/colors';
import { updateSettings } from '../../store/actions/settings';
import { refreshWallet } from '../../utils/wallet';
import ActivityListShort from '../../screens/Activity/ActivityListShort';
import EmptyWallet from '../../screens/Activity/EmptyWallet';
import DetectSwipe from '../../components/DetectSwipe';
import BalanceHeader from '../../components/BalanceHeader';
import Suggestions from '../../components/Suggestions';
import Widgets from '../../components/Widgets';
import ConnectivityIndicator from '../../components/ConnectivityIndicator';
import SafeAreaView from '../../components/SafeAreaView';
import BetaWarning from '../../components/BetaWarning';
import Assets from '../../components/Assets';
import Header from './Header';
import type { WalletScreenProps } from '../../navigation/types';
import {
	hideBalanceSelector,
	hideOnboardingMessageSelector,
} from '../../store/reselect/settings';
import { widgetsSelector } from '../../store/reselect/widgets';

const Wallets = ({
	navigation,
	route,
}: WalletScreenProps<'Wallets'>): ReactElement => {
	const { onFocus } = route.params;
	const [refreshing, setRefreshing] = useState(false);
	const [scrollEnabled, setScrollEnabled] = useState(true);
	const colors = useColors();
	const hideBalance = useSelector(hideBalanceSelector);
	const hideOnboardingSetting = useSelector(hideOnboardingMessageSelector);
	const widgets = useSelector(widgetsSelector);
	const noTransactions = useNoTransactions();
	const empty = useMemo(() => {
		return noTransactions && Object.values(widgets).length === 0;
	}, [noTransactions, widgets]);

	// tell WalletNavigator that this screen is focused
	useFocusEffect(
		useCallback(() => {
			onFocus(true);
			return (): void => onFocus(false);
		}, [onFocus]),
	);

	const toggleHideBalance = (): void => {
		updateSettings({ hideBalance: !hideBalance });
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

	const handleWidgetsEditStart = useCallback(() => setScrollEnabled(false), []);
	const handleWidgetsEditEnd = useCallback(() => setScrollEnabled(true), []);

	const hideOnboarding = hideOnboardingSetting || !empty;

	return (
		<SafeAreaView>
			<Header />
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
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={colors.refreshControl}
						/>
					}
					scrollEnabled={scrollEnabled}>
					<DetectSwipe
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
								<ConnectivityIndicator />
								<Assets />
								<Widgets
									onEditStart={handleWidgetsEditStart}
									onEditEnd={handleWidgetsEditEnd}
								/>
								<ActivityListShort />
								<BetaWarning />
							</View>
						</>
					) : (
						<EmptyWallet />
					)}
				</ScrollView>
			</DetectSwipe>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
	},
	scrollView: {
		paddingBottom: 130,
	},
	contentPadding: {
		paddingHorizontal: 16,
	},
});

export default memo(Wallets);
