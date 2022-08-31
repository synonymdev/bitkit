import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { handleData, decodeQRData } from '../../utils/scanner';
import Store from '../../store/types';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import NavigationHeader from '../../components/NavigationHeader';
import { showErrorNotification } from '../../utils/notifications';
import ScannerComponent from './ScannerComponent';

const ScannerScreen = ({ navigation }): ReactElement => {
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);

	const onRead = async (data): Promise<void> => {
		const res = await decodeQRData(data, selectedNetwork);
		if (res.isErr() || (res.isOk() && res.value.length === 0)) {
			showErrorNotification({
				title: 'QR code',
				message: 'Sorry. Bitkit can’t read this QR code.',
			});
			return;
		}

		navigation.pop();

		await handleData({
			qrData: res.value,
			selectedNetwork,
			selectedWallet,
		});
	};

	return (
		<ScannerComponent onRead={onRead}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				style={styles.navigationHeader}
				title="Scan any QR code"
			/>
		</ScannerComponent>
	);
};

const styles = StyleSheet.create({
	navigationHeader: {
		zIndex: 100,
	},
});

export default ScannerScreen;
