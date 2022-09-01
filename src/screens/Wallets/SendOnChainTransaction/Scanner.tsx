import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { decodeQRData, EQRDataType } from '../../../utils/scanner';
import Store from '../../../store/types';
import NavigationHeader from '../../../components/NavigationHeader';
import ScannerComponent from '../../Scanner/ScannerComponent';
import { showErrorNotification } from '../../../utils/notifications';

const ScannerScreen = ({ navigation, route }): ReactElement => {
	const { onScan } = route.params;

	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const onRead = async (data): Promise<void> => {
		const res = await decodeQRData(data, selectedNetwork);

		if (res.isErr()) {
			showErrorNotification({
				title: 'Sorry. Bitkit can’t read this QR code.',
				message: res.error.message,
			});
			return;
		}

		const bitcoinAddress = res.value.find(
			({ qrDataType }) => qrDataType === EQRDataType.bitcoinAddress,
		);

		if (!bitcoinAddress) {
			showErrorNotification({
				title: 'QR code',
				message: "Sorry. We couldn't find Bitcoin address.",
			});
			return;
		}

		navigation.pop();
		onScan(bitcoinAddress);
	};

	return (
		<ScannerComponent onRead={onRead}>
			<NavigationHeader style={styles.navigationHeader} title="Scan QR code" />
		</ScannerComponent>
	);
};

const styles = StyleSheet.create({
	navigationHeader: {
		zIndex: 100,
	},
});

export default ScannerScreen;
