import React, { memo, ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet } from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';

import { View } from '../../styles/components';
import Header from './Header';
import DetectSwipe from '../../components/DetectSwipe';
import BalanceHeader from '../../components/BalanceHeader';
import TodoCarousel from '../../components/TodoCarousel';
import Widgets from '../../components/Widgets';
import ConnectivityIndicator from '../../components/ConnectivityIndicator';
import SafeAreaView from '../../components/SafeAreaView';
import ActivityListShort from '../../screens/Activity/ActivityListShort';
import EmptyWallet from '../../screens/Activity/EmptyWallet';
import BetaWarning from '../../components/BetaWarning';
import { useNoTransactions } from '../../hooks/wallet';
import useColors from '../../hooks/colors';
import { updateSettings } from '../../store/actions/settings';
import Store from '../../store/types';
import { refreshWallet } from '../../utils/wallet';
import type { TabScreenProps } from '../../navigation/types';
import Assets from '../../components/Assets';

const Wallets = ({ navigation }: TabScreenProps<'Wallets'>): ReactElement => {
	const [refreshing, setRefreshing] = useState(false);
	const hideBalance = useSelector((state: Store) => state.settings.hideBalance);
	const hideOnboardingSetting = useSelector(
		(state: Store) => state.settings.hideOnboardingMessage,
	);
	const empty = useNoTransactions();
	const colors = useColors();

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
		//Refresh wallet and then update activity list
		await Promise.all([refreshWallet({})]);
		setRefreshing(false);
	};

	const hideOnboarding = hideOnboardingSetting || !empty;

	return (
		<SafeAreaView>
			<Header />
			<DetectSwipe
				onSwipeLeft={navigateToScanner}
				onSwipeRight={navigateToProfile}>
				<ScrollView
					contentContainerStyle={hideOnboarding && styles.scrollview}
					disableScrollViewPanResponder={true}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={colors.refreshControl}
						/>
					}>
					<DetectSwipe
						onSwipeLeft={toggleHideBalance}
						onSwipeRight={toggleHideBalance}>
						<View>
							<BalanceHeader />
						</View>
					</DetectSwipe>

					{hideOnboarding ? (
						<>
							<TodoCarousel />
							<View style={styles.content}>
								<ConnectivityIndicator />
								<Assets navigation={navigation} />
								<Widgets />
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
		paddingHorizontal: 16,
	},
	scrollview: {
		paddingBottom: 130,
	},
	assetsTitle: {
		marginBottom: 8,
		marginTop: 32,
	},
});

export default memo(Wallets);
