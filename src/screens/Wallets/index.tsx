import React, { memo, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { LayoutAnimation, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
	View,
	Subtitle,
	BitcoinCircleIcon,
	TetherCircleIcon,
} from '../../styles/components';
import Header from './Header';
import DetectSwipe from '../../components/DetectSwipe';
import BalanceHeader from '../../components/BalanceHeader';
import TodoCarousel from '../../components/TodoCarousel';
import SafeAreaView from '../../components/SafeAreaView';
import AssetCard from '../../components/AssetCard';
import ActivityListShort from '../../screens/Activity/ActivityListShort';
import { useBalance } from '../../hooks/wallet';
import { updateSettings } from '../../store/actions/settings';
import Store from '../../store/types';

const Wallets = ({ navigation }): ReactElement => {
	const hideBalance = useSelector((state: Store) => state.settings.hideBalance);

	LayoutAnimation.easeInEaseOut();

	const onSwipeLeft = (): void => {
		//Swiping left, navigate to the scanner/camera.
		navigation.navigate('Scanner');
	};

	const onSwipeRight = (): void => {
		updateSettings({ hideBalance: !hideBalance });
	};

	const { satoshis } = useBalance({ onchain: true, lightning: true });

	return (
		<SafeAreaView>
			<Header />
			<ScrollView
				contentContainerStyle={styles.scrollview}
				disableScrollViewPanResponder={true}
				showsVerticalScrollIndicator={false}>
				<DetectSwipe onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
					<View>
						<BalanceHeader />
					</View>
				</DetectSwipe>
				<TodoCarousel />
				<DetectSwipe onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
					<View style={styles.content}>
						<Subtitle style={styles.assetsTitle}>Assets</Subtitle>
						<AssetCard
							name="Bitcoin"
							ticker="BTC"
							satoshis={satoshis}
							icon={<BitcoinCircleIcon />}
							onPress={(): void =>
								navigation.navigate('WalletsDetail', { assetType: 'bitcoin' })
							}
						/>
						<AssetCard
							name="Tether"
							ticker="USDT"
							disabled={true}
							satoshis={satoshis}
							icon={<TetherCircleIcon />}
						/>
					</View>
				</DetectSwipe>
				<View style={styles.content}>
					<ActivityListShort />
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: 16,
	},
	scrollview: {
		paddingBottom: 400,
	},
	assetsTitle: {
		marginBottom: 8,
		marginTop: 32,
	},
});

export default memo(Wallets);
