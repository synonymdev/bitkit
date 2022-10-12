import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { processInputData } from '../../../utils/scanner';
import Store from '../../../store/types';
import NavigationHeader from '../../../components/NavigationHeader';
import ScannerComponent from '../../Scanner/ScannerComponent';
import { showErrorNotification } from '../../../utils/notifications';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import type { SendScreenProps } from '../../../navigation/types';

const ScannerScreen = ({
	navigation,
}: SendScreenProps<'Scanner'>): ReactElement => {
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const sdk = useSlashtagsSDK();

	const onRead = async (data): Promise<void> => {
		if (!data) {
			showErrorNotification({
				title: 'No Data Detected',
				message: 'Sorry. Bitkit is not able to read this QR code.',
			});
			return;
		}
		navigation.pop();
		processInputData({
			data,
			source: 'sendScanner',
			sdk,
			selectedNetwork,
			selectedWallet,
		}).then();
	};

	return (
		<ScannerComponent onRead={onRead}>
			<NavigationHeader style={styles.navigationHeader} title="Scan QR Code" />
		</ScannerComponent>
	);
};

const styles = StyleSheet.create({
	navigationHeader: {
		zIndex: 100,
	},
});

export default memo(ScannerScreen);
