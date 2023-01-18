import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { processInputData } from '../../../utils/scanner';
import NavigationHeader from '../../../components/NavigationHeader';
import ScannerComponent from '../../Scanner/ScannerComponent';
import { showErrorNotification } from '../../../utils/notifications';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import type { SendScreenProps } from '../../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const ScannerScreen = ({
	navigation,
	route,
}: SendScreenProps<'Scanner'>): ReactElement => {
	const onScan = route.params?.onScan;
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

		navigation.pop();

		const result = await processInputData({
			data,
			source: 'sendScanner',
			sdk,
			selectedNetwork,
			selectedWallet,
		}).then();

		if (result.isOk()) {
			onScan?.(result.value);
		}
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
