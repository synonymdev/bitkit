import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { processInputData } from '../../../utils/scanner';
import { showErrorNotification } from '../../../utils/notifications';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import ScannerComponent from '../../Scanner/ScannerComponent';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const ScannerScreen = (): ReactElement => {
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const sdk = useSlashtagsSDK();

	const onRead = async (data: string): Promise<void> => {
		if (!data) {
			showErrorNotification({
				title: 'No Data Detected',
				message: 'Sorry. Bitkit is not able to read this QR code.',
			});
			return;
		}

		await processInputData({
			data,
			source: 'sendScanner',
			sdk,
			selectedNetwork,
			selectedWallet,
		}).then();
	};

	return (
		<ScannerComponent transparent={false} onRead={onRead}>
			<BottomSheetNavigationHeader
				style={styles.navigationHeader}
				title="Scan QR Code"
			/>
		</ScannerComponent>
	);
};

const styles = StyleSheet.create({
	navigationHeader: {
		zIndex: 100,
	},
});

export default memo(ScannerScreen);
