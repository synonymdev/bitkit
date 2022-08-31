import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { decodeQRData } from '../../../utils/scanner';
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
		if (res.isErr() || (res.isOk() && res.value.length === 0)) {
			showErrorNotification({
				title: 'QR code',
				message: 'Sorry. Bitkit can’t read this QR code.',
			});
			return;
		}

		navigation.pop();
		onScan(res.value[0]);
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
