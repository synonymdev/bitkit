import React, { memo, ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet } from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';

import { BitcoinCircleIcon, Subtitle, View } from '../../styles/components';
import Header from './Header';
import DetectSwipe from '../../components/DetectSwipe';
import BalanceHeader from '../../components/BalanceHeader';
import TodoCarousel from '../../components/TodoCarousel';
import ConnectivityIndicator from '../../components/ConnectivityIndicator';
import SafeAreaView from '../../components/SafeAreaView';
import AssetCard from '../../components/AssetCard';
import ActivityListShort from '../../screens/Activity/ActivityListShort';
import EmptyWallet from '../../screens/Activity/EmptyWallet';
import BetaWarning from '../../components/BetaWarning';
import { useBalance, useNoTransactions } from '../../hooks/wallet';
import useColors from '../../hooks/colors';
import { updateSettings } from '../../store/actions/settings';
import Store from '../../store/types';
import { refreshWallet } from '../../utils/wallet';

const Wallets = ({ navigation }): ReactElement => {
	const [refreshing, setRefreshing] = useState(false);
	const hideBalance = useSelector((state: Store) => state.settings.hideBalance);
	const empty = useNoTransactions();
	const { satoshis } = useBalance({ onchain: true, lightning: true });
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

	return (
		<SafeAreaView>
			<Header />
			<DetectSwipe
				onSwipeLeft={navigateToScanner}
				onSwipeRight={navigateToProfile}>
				<ScrollView
					contentContainerStyle={!empty && styles.scrollview}
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

					{empty ? (
						<EmptyWallet />
					) : (
						<>
							<TodoCarousel />
							<View style={styles.content}>
								<ConnectivityIndicator />
								<Subtitle style={styles.assetsTitle}>Assets</Subtitle>
								<AssetCard
									name={'Bitcoin'}
									ticker={'BTC'}
									satoshis={satoshis}
									icon={<BitcoinCircleIcon />}
									onPress={(): void => {
										navigation.navigate('WalletsDetail', {
											assetType: 'bitcoin',
										});
									}}
								/>
								<ActivityListShort />
								<BetaWarning />
							</View>
						</>
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
