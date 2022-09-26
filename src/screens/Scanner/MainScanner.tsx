import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { processInputData } from '../../utils/scanner';
import Store from '../../store/types';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import NavigationHeader from '../../components/NavigationHeader';
import { showErrorNotification } from '../../utils/notifications';
import ScannerComponent from './ScannerComponent';
import type { RootStackScreenProps } from '../../navigation/types';
import DetectSwipe from '../../components/DetectSwipe';

const ScannerScreen = ({
	navigation,
	route,
}: RootStackScreenProps<'Scanner'>): ReactElement => {
	const onScan = route.params?.onScan;
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);

	const onSwipeRight = (): void => {
		navigation.navigate('Tabs');
	};

	const onRead = async (data): Promise<void> => {
		if (!data) {
			showErrorNotification({
				title: 'No Data Detected',
				message: 'Sorry. Bitkit is not able to read this QR code.',
			});
			return;
		}

		navigation.pop();

		if (onScan) {
			onScan(data);
			return;
		}

		processInputData({
			data,
			selectedNetwork,
			selectedWallet,
		}).then();
	};

	return (
		<DetectSwipe onSwipeRight={onSwipeRight}>
			<ScannerComponent onRead={onRead} shouldDecode={!onScan}>
				<SafeAreaInsets type="top" />
				<NavigationHeader
					style={styles.navigationHeader}
					title="Scan Any QR Code"
				/>
			</ScannerComponent>
		</DetectSwipe>
	);
};

const styles = StyleSheet.create({
	navigationHeader: {
		zIndex: 100,
	},
});

export default memo(ScannerScreen);
