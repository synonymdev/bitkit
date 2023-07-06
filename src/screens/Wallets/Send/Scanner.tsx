import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { processInputData, validateInputData } from '../../../utils/scanner';
import { showToast } from '../../../utils/notifications';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import ScannerComponent from '../../Scanner/ScannerComponent';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const ScannerScreen = (): ReactElement => {
	const { t } = useTranslation('other');
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const sdk = useSlashtagsSDK();

	const onRead = async (data: string): Promise<void> => {
		if (!data) {
			showToast({
				type: 'error',
				title: t('qr_error_header'),
				description: t('qr_error_text'),
			});
			return;
		}

		const decodeRes = await validateInputData({
			data,
			source: 'send',
			sdk,
			showErrors: true,
		});
		if (decodeRes.isOk()) {
			await processInputData({
				data,
				source: 'send',
				sdk,
				selectedNetwork,
				selectedWallet,
			});
		}
	};

	return (
		<ScannerComponent transparent={false} onRead={onRead}>
			<BottomSheetNavigationHeader
				style={styles.navigationHeader}
				title={t('qr_scan')}
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
